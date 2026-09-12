/**
 * ============================================================================
 * Fayzar Computer v2 — Google Apps Script Server-Side AI OCR Proxy
 * (SECURE BACKEND PROXY — ELIMINATES CLIENT-SIDE API KEY EXPOSURE)
 * ============================================================================
 * 
 * Deployment Instructions (কিভাবে ডিপ্লয় করবেন):
 * 1. Google Apps Script খুলুন: https://script.google.com → "New project" (নতুন প্রজেক্ট)
 * 2. এই সম্পূর্ণ কোডটি এডিটরে পেস্ট করুন।
 * 3. বামপাশের Project Settings (গিয়ার আইকন ⚙️) → Script Properties (স্ক্রিপ্ট প্রপার্টিজ):
 *      Property Name:  GEMINI_API_KEY
 *      Property Value: <আপনার আসল Gemini API Key এখানে দিন>
 * 4. উপরে Deploy → New deployment → Web app নির্বাচন করুন:
 *      Description:    Fayzar AI OCR Secure Proxy
 *      Execute as:     Me (আপনার গুগল একাউন্ট)
 *      Who has access: Anyone (যে কেউ)
 * 5. Deploy ক্লিক করে Web App URL টি কপি করুন।
 * 6. Fayzar Computer ওয়েবসাইটের সেটিংস-এ "গুগল অ্যাপস স্ক্রিপ্ট (GAS) প্রক্সি URL" বক্সে পেস্ট করুন।
 * 
 * সুফল: সাধারণ ব্যবহারকারীরা ব্রাউজারের DevTools বা Network Tab থেকে কখনোই আপনার API Key দেখতে বা চুরি করতে পারবে না!
 * ============================================================================
 */

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite'
];

const GEMINI_PROMPT = `তুমি একজন বিশেষজ্ঞ একাডেমিক প্রশ্নপত্র OCR ট্রান্সক্রাইবার এবং LaTeX/Word ডকুমেন্ট বিশেষজ্ঞ। তোমার কাজ হলো প্রদত্ত স্ক্যান করা প্রশ্নপত্র, বই বা নথির ছবি থেকে ১০০% নির্ভুল বাংলা ইউনিকোড টেক্সট ও LaTeX গাণিতিক সমীকরণ এক্সট্রাক্ট করা এবং সোর্স ফাইলের অবিকল কাঠামো তৈরি করা।

১. হুবহু ট্রান্সক্রিপশন (Pure OCR):
   - মূল ছবিতে যেভাবে যে লাইন, সমীকরণ ও বাংলা লেখা রয়েছে, ঠিক অবিকল সেভাবেই হুবহু লিখবে।
   - নিজে থেকে কোনো নতুন সমীকরণ সমাধান করবে না বা অপ্রয়োজনীয় লেখা ("নিচের সমীকরণগুলো সমাধান কর") বানাবে না।
   - ২-কলাম থাকলে প্রথম কলামের সম্পূর্ণ অংশ লিখে তারপর দ্বিতীয় কলামের অংশ লিখবে।

২. সমীকরণ ও সূত্র (LaTeX):
   - সমস্ত গাণিতিক সমীকরণ $...$ বা $$...$$ ফরম্যাটে লিখবে।
   - লেটেক্স কোডের ভেতরে কোনো বাংলা শব্দ রাখবে না।

৩. পুনরাবৃত্তি বর্জন (Anti-Loop):
   - কোনো অবস্থাতেই একই সমীকরণ বা লাইন বারবার পুনরাবৃত্তি করবে না। প্রতিটি সমীকরণ ও লাইন একবারই লিখবে।`;

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: 'কোনো পেলোড পাওয়া যায়নি।' }, 400);
    }

    var requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({ success: false, error: 'অবৈধ JSON ডেটা: ' + parseErr.message }, 400);
    }

    // Retrieve master API key from secure Script Properties
    var scriptProps = PropertiesService.getScriptProperties();
    var apiKey = scriptProps.getProperty('GEMINI_API_KEY');

    // Optional user BYOK override from request if user supplied their own
    if (requestData.apiKey && requestData.apiKey.trim().length > 10) {
      apiKey = requestData.apiKey.trim();
    }

    if (!apiKey) {
      return createJsonResponse({
        success: false,
        error: 'সার্ভার কনফিগারেশন ত্রুটি: Script Properties-এ GEMINI_API_KEY সেট করা নেই।'
      }, 500);
    }

    // Collect all media items (Single or Multi-image/pages)
    var mediaParts = [];
    if (Array.isArray(requestData.images) && requestData.images.length > 0) {
      for (var i = 0; i < requestData.images.length; i++) {
        var imgItem = requestData.images[i];
        var rawB64 = imgItem.imageBase64 || imgItem.data || '';
        if (rawB64.indexOf('base64,') !== -1) rawB64 = rawB64.split('base64,')[1];
        if (rawB64) {
          mediaParts.push({
            inlineData: {
              mimeType: imgItem.mimeType || 'image/jpeg',
              data: rawB64
            }
          });
        }
      }
    } else if (requestData.imageBase64) {
      var singleB64 = requestData.imageBase64;
      if (singleB64.indexOf('base64,') !== -1) singleB64 = singleB64.split('base64,')[1];
      mediaParts.push({
        inlineData: {
          mimeType: requestData.mimeType || 'image/jpeg',
          data: singleB64
        }
      });
    }

    if (mediaParts.length === 0) {
      return createJsonResponse({ success: false, error: 'কোনো ইমেজ বা পেজ ডেটা পাওয়া যায়নি।' }, 400);
    }

    var parts = [{ text: requestData.prompt || GEMINI_PROMPT }].concat(mediaParts);
    var payload = {
      contents: [{ parts: parts }],
      generationConfig: {
        temperature: 0.05,
        maxOutputTokens: 8192
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    var candidateList = CANDIDATE_MODELS.slice();
    if (requestData.model && CANDIDATE_MODELS.indexOf(requestData.model) !== -1) {
      candidateList = [requestData.model].concat(candidateList.filter(function(m) { return m !== requestData.model; }));
    }

    var lastErrorMsg = '';

    for (var mIdx = 0; mIdx < candidateList.length; mIdx++) {
      var currentModel = candidateList[mIdx];
      var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + currentModel + ':generateContent?key=' + apiKey;

      var options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      try {
        var response = UrlFetchApp.fetch(url, options);
        var statusCode = response.getResponseCode();
        var responseText = response.getContentText();

        if (statusCode === 200) {
          var parsedData = JSON.parse(responseText);
          var candidate = parsedData.candidates && parsedData.candidates[0];
          if (candidate && candidate.content && candidate.content.parts) {
            var extractedText = candidate.content.parts.map(function(p) { return p.text || ''; }).join('\n');
            return createJsonResponse({
              success: true,
              extractedText: extractedText,
              modelUsed: currentModel,
              totalImagesProcessed: mediaParts.length
            }, 200);
          }
        }

        // Handle Rate Limit (429) or Server Overload (503) with Backoff
        if (statusCode === 429 || statusCode === 503) {
          Utilities.sleep(1500); // 1.5 second cooldown before next candidate model
          lastErrorMsg = currentModel + ' রেট লিমিট (HTTP ' + statusCode + ')';
          continue;
        }

        var errJson = {};
        try { errJson = JSON.parse(responseText); } catch(e) {}
        lastErrorMsg = (errJson.error && errJson.error.message) || ('HTTP ' + statusCode);

      } catch (fetchErr) {
        lastErrorMsg = fetchErr.message;
      }
    }

    return createJsonResponse({
      success: false,
      error: 'সবগুলো AI মডেল চেষ্টা করা হয়েছে কিন্তু ব্যর্থ হয়েছে। শেষ এরর: ' + lastErrorMsg
    }, 500);

  } catch (globalErr) {
    return createJsonResponse({
      success: false,
      error: 'প্রক্সি সার্ভার ত্রুটি: ' + globalErr.message
    }, 500);
  }
}

function doGet(e) {
  return createJsonResponse({
    status: 'online',
    message: 'Fayzar AI OCR Secure Backend Proxy is running smoothly.',
    timestamp: new Date().toISOString()
  }, 200);
}

function createJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
