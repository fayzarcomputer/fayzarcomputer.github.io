/**
 * Fayzar Computer - Internationalization (i18n) & Day/Night Theme Engine
 * 100% Client-side, Zero-dependency, Offline-compatible
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Translations Dictionary (Bangla & English)
  // =========================================================================
  const translations = {
    bn: {
      // Top Bar
      top_phone: '+880 1717-101919',
      top_location: 'ফুলবাড়ী সরকারি কলেজ গেট, দিনাজপুর',
      top_hours: 'শনি - বৃহস্পতি: সকাল ১০টা - রাত ৯টা | শুক্র: বিকাল ৪টা - রাত ৯টা',
      top_hotline: 'ভূমি সেবা: ১৬১২২ | জরুরি সেবা: ৯৯৯',
      topbar_tagline: 'স্মার্ট ভূমিসেবা ও নাগরিক ডিজিটাল সহায়তা কেন্দ্র',
      topbar_status: 'দোকান খোলা আছে (রাত ৯টা পর্যন্ত)',
      theme_day: 'ডে মোড',
      theme_night: 'নাইট মোড',
      lang_label: 'বাংলা',
      
      // Brand
      brand_name: 'ফয়জার কম্পিউটার',
      brand_sub: 'ডিজিটাল ও ভূমিসেবা কেন্দ্র',
      brand_domain: 'fayzarcomputer.com.bd',

      // 8-Item Sequential Navigation Menu
      nav_home: 'হোম',
      nav_land: 'ভূমিসেবা',
      nav_services: 'অন্যান্য সেবাসমূহ',
      nav_notices: 'চাকরি সংক্রান্ত',
      nav_tools: 'কনভার্টার ও টুলস',
      nav_results: 'ফলাফল',
      nav_links: 'প্রয়োজনীয় ওয়েবলিংক',
      nav_contact: 'যোগাযোগ',
      nav_cta: 'শুরু করুন',
      nav_services_short: 'সার্ভিস',
      nav_jobs_short: 'জব',
      nav_converter_short: 'কনভার্টার',
      nav_tools_short: 'টুলস',
      nav_results_short: 'রেজাল্ট',
      nav_contact_short: 'কন্টাক্ট',

      // Hero Section
      hero_badge: 'সরকার অনুমোদিত ভূমিসেবা কেন্দ্র (দিনাজ/ফুল/এলএসএসএফসি-০৭/২০২৫)',
      hero_title: 'ফয়জার কম্পিউটার এন্ড ফটোস্ট্যাট',
      hero_domain: 'fayzarcomputer.com.bd',
      hero_subtitle: 'আপনার বিশ্বস্ত ডিজিটাল, অনলাইন ও ভূমিসেবা সহায়তা কেন্দ্র',
      hero_description: 'ই-নামজারি, খতিয়ান ও খাজনা পরিশোধের পাশাপাশি সরকারি চাকরির আবেদন, জাতীয় বিশ্ববিদ্যালয় ভর্তি, টেলিটক ছবি রিসাইজিং এবং ডিজিটাল প্রিন্টিং সেবা।',
      hero_btn_services: 'আমাদের সেবাসমূহ',
      hero_btn_converter: 'কনভার্টার ও টুলস',

      // 4-Column Core Solutions Grid
      grid_tag: 'আমাদের মূল শক্তিমত্তা',
      grid_title: 'আপনার জন্য বিশেষায়িত ডিজিটাল সেবা সমাধান',
      grid_subtitle: 'স্বল্প সময়ে, সরকারি নিয়মে বিশ্বস্ত কম্পিউটার ও ভূমিসেবা সহায়তা',
      
      card1_badge: 'ভূমিসেবা',
      card1_title: 'ডিজিটাল ভূমিসেবা',
      card1_desc: 'খতিয়ান অনুসন্ধান, জমির পর্চা, ই-নামজারি ও বার্ষিক খাজনা পরিশোধ',
      card1_link: 'বিস্তারিত দেখুন →',

      card2_badge: 'অনলাইন',
      card2_title: 'নাগরিক অনলাইন সেবা',
      card2_desc: 'চাকরি, ভর্তি, এনআইডি, পাসপোর্ট, ড্রাইভিং ও আয়কর ই-রিটার্ন আবেদন',
      card2_link: 'বিস্তারিত দেখুন →',

      card3_badge: 'কম্পোজ ও টাইপিং',
      card3_title: 'ডকুমেন্ট টাইপিং ও কম্পোজ',
      card3_desc: 'দ্রুত বাংলা ও ইংরেজি কম্পোজ, আবেদনপত্র, চুক্তিপত্র ও নির্ভুল ফরম্যাটিং',
      card3_link: 'বিস্তারিত দেখুন →',
      card3_btn_quick: '⚡ ইউনিকোড ⇄ বিজয় কনভার্টার খুলুন',

      card4_badge: 'প্রিন্টিং ও স্টুডিও',
      card4_title: 'প্রিন্টিং ও ফটোস্ট্যাট',
      card4_desc: 'হাই-স্পিড ডিজিটাল ফটোকপি, কালার প্রিন্ট, ল্যামিনেশন ও পাসপোর্ট ছবি',
      card4_link: 'বিস্তারিত দেখুন →',

      // Land Services Spotlight
      land_tag: 'বিশেষায়িত সেবা',
      land_title: 'স্মার্ট ভূমিসেবা ও নাগরিক সহায়তা',
      land_subtitle: 'ভূমি মন্ত্রণালয় অনুমোদিত কেন্দ্র থেকে নির্ভুল ও হয়রানিমুক্ত সেবা',
      land_mutation_title: 'ই-নামজারি ও খতিয়ান',
      land_mutation_desc: 'জমি ক্রয় বা ওয়ারিশসূত্রে প্রাপ্ত জমির নতুন খতিয়ান তৈরি ও অনলাইন ট্র্যাকিং।',
      land_tax_title: 'অনলাইন জমির খাজনা (LD-Tax)',
      land_tax_desc: 'হোল্ডিং এন্ট্রি, ভূমি উন্নয়ন কর পরিশোধ এবং তাৎক্ষণিক ডিজিটাল দাখিলা রসিদ।',
      land_khatian_title: 'পর্চা ও মৌজা ম্যাপ',
      land_khatian_desc: 'CS, SA, RS খতিয়ান যাচাই এবং ডাকযোগে মূল সার্টিফাইড পর্চা ও ডিজিটাল ম্যাপ সংগ্রহ।',
      land_btn_apply: 'আবেদন করুন →',
      land_btn_pay: 'খাজনা দিন →',
      land_btn_search: 'পর্চা খুঁজুন →',
      land_view_all: 'সকল ভূমিসেবা দেখুন →',

      // Live Circulars Section
      notices_tag: 'তাত্ক্ষণিক বিজ্ঞপ্তি',
      notices_title: 'চলমান চাকরি ও ভর্তি বিজ্ঞপ্তি',
      notices_subtitle: 'সরকারি-বেসরকারি চাকরি ও বিভিন্ন পরীক্ষার সর্বশেষ সময়সীমা',
      notices_view_all: 'সকল বিজ্ঞপ্তি দেখুন',
      notice_apply_online: 'অনলাইন আবেদন লিংক →',
      notice_apply_shop: 'দোকান থেকে আবেদন',
      notice_vacancies_lbl: 'পদসংখ্যা:',
      notice_deadline_lbl: 'শেষ সময়:',

      // Useful Web Links
      links_tag: 'সরকারি ও শিক্ষামূলক পোর্টাল',
      links_title: 'প্রয়োজনীয় গুরুত্বপূর্ণ ওয়েবলিংকসমূহ',
      links_subtitle: 'এক ক্লিকেই প্রবেশ করুন জাতীয় ভূমিসেবা, শিক্ষাবোর্ড, চাকরি ও নাগরিক পোর্টালে',
      links_cat_land: 'ভূমিসেবা পোর্টাল',
      links_cat_job: 'চাকরি ও নিয়োগ পোর্টাল',
      links_cat_citizen: 'নাগরিক সেবা পোর্টাল',
      links_cat_edu: 'শিক্ষা ও ফলাফল পোর্টাল',
      link_mutation: 'ই-নামজারি পোর্টাল',
      link_ldtax: 'ভূমি উন্নয়ন কর (LD-Tax)',
      link_eporcha: 'অনলাইন খতিয়ান (e-Porcha)',
      link_dlrs: 'মৌজা ম্যাপ পোর্টাল (DLRS)',
      link_land_help: 'জাতীয় ভূমি হেল্পলাইন: ১৬১২২',
      link_alljobs: 'টেলিটক অলজবস (AllJobs)',
      link_bpsc: 'সরকারি কর্ম কমিশন (BPSC)',
      link_dpe: 'প্রাথমিক শিক্ষা অধিদপ্তর (DPE)',
      link_bb: 'বাংলাদেশ ব্যাংক ই-রিক্রুটমেন্ট',
      link_job_help: 'অনলাইন আবেদন সহায়তা সেবা',
      link_nid: 'এনআইডি পোর্টাল (NID Wing)',
      link_epassport: 'ই-পাসপোর্ট পোর্টাল (E-Passport)',
      link_pcc: 'পুলিশ ক্লিয়ারেন্স (PCC)',
      link_etax: 'অনলাইন আয়কর রিটার্ন (e-Return)',
      link_citizen_help: 'সরকারি ফি ও চালান সমাধান',
      link_nu: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি ও ফরম',
      link_eduboard: 'শিক্ষাবোর্ড ফলাফল (SSC/HSC)',
      link_phulbari_col: 'ফুলবাড়ী সরকারি কলেজ নোটিশ',
      link_bteb: 'কারিগরি শিক্ষা বোর্ড (BTEB)',
      link_edu_help: 'ভর্তি ও রেজাল্ট মার্কশিট প্রিন্ট',

      // Customer Reviews & Testimonials
      reviews_tag: 'গ্রাহক মতামত',
      reviews_title: 'আমাদের সম্মানিত গ্রাহকদের অভিজ্ঞতা',
      reviews_subtitle: 'নির্ভুল ও দ্রুত ডিজিটাল সেবায় ফুলবাড়ীবাসীর বিশ্বস্ত কেন্দ্র',
      review1_name: 'মাহমুদুল হাসান',
      review1_role: 'বিশ্ববিদ্যালয় শিক্ষার্থী',
      review1_service: 'অনলাইন আবেদন ও ফরম',
      review1_text: 'চমৎকার ও আন্তরিক সেবা। চাকরির আবেদনের ছবি ও স্বাক্ষর নিখুঁতভাবে রিসাইজ করে সঠিক সময়ে সাবমিট করে দিয়েছেন।',
      review2_name: 'মোঃ আনোয়ারুল ইসলাম',
      review2_role: 'ব্যবসায়ী ও ভূমির মালিক',
      review2_service: 'ডিজিটাল ভূমিসেবা',
      review2_text: 'খুবই দ্রুততম সময়ে জমির ই-নামজারি আবেদন ও ট্র্যাকিং করে দিয়েছেন। ফুলবাড়ীতে এমন নির্ভরযোগ্য সেবা পাওয়া সত্যি আনন্দের।',
      review3_name: 'রাবেয়া খাতুন',
      review3_role: 'সরকারি প্রাথমিক শিক্ষক প্রার্থী',
      review3_service: 'টেলিটক আবেদন ও এডমিট',
      review3_text: 'প্রাথমিক শিক্ষক নিয়োগের আবেদন ও প্রবেশপত্র প্রিন্ট নির্ভুলভাবে পেয়েছি। ফয়জার ভাইয়ের সেবা অত্যন্ত আন্তরিক।',

      // Contact & Footer
      contact_tag: 'আমাদের অবস্থান',
      contact_title: 'সরাসরি আমাদের সেন্টারে আসুন',
      contact_subtitle: 'ফুলবাড়ী সরকারি কলেজ গেটের পশ্চিম পার্শ্বে, ফুলবাড়ী, দিনাজপুর',
      contact_phone_lbl: 'মোবাইল নম্বর:',
      contact_whatsapp_lbl: 'হোয়াটসঅ্যাপ চ্যাট:',
      contact_hours_lbl: 'খোলা থাকার সময়:',
      footer_desc: 'সরকার অনুমোদিত উন্মুক্ত ভূমিসেবা কেন্দ্র (LSFC) ও বিশ্বস্ত ডিজিটাল সার্ভিস সেন্টার। ফুলবাড়ী, দিনাজপুর।',
      footer_col_services: 'জনপ্রিয় সেবাসমূহ',
      footer_col_links: 'প্রয়োজনীয় লিংক',
      footer_col_helpline: 'জরুরি হেল্পলাইন',
      footer_quick_nav: 'দ্রুত নেভিগেশন',
      footer_tools_title: 'টুলস ও পোর্টাল',
      footer_tool_converter: 'ইউনিকোড ⇄ বিজয় কনভার্টার',
      footer_tool_equation: 'ওয়ার্ড EQ ও ল্যাটেক্স কনভার্টার',
      footer_tool_ocr: 'AI OCR প্রশ্নপত্র কনভার্টার',
      footer_tool_resizer: 'টেলিটক ছবি ও স্বাক্ষর রিসাইজার',
      footer_admin: 'এডমিন প্যানেল',
      footer_proprietor: 'প্রোপাইটর: মোঃ ফয়জার আলী',
      footer_approval: 'অনুমোদন নং: দিনাজ/ফুল/এলএসএসএফসি-০৭/২০২৫',
      footer_rights: '© ২০২৬ সর্বস্বত্ব সংরক্ষিত। ফয়জার কম্পিউটার এন্ড ফটোস্ট্যাট।',
      footer_address_line: 'ফুলবাড়ী সরকারি কলেজ গেট, ফুলবাড়ী, দিনাজপুর | ফোন: 01717-101919',
      btn_whatsapp: 'হোয়াটসঅ্যাপে মেসেজ',
      btn_call_now: 'সরাসরি কল',
      btn_apply_online: 'অনলাইন আবেদন লিংক →',
      btn_apply_shop: 'দোকান থেকে আবেদন',
      notice_vacancies: 'পদসংখ্যা:',
      notice_deadline: 'শেষ সময়:',

      // Land.gov.bd Inspired Redesign Keys
      topbar_helpline: 'ভূমিসেবা হটলাইন: ১৬১২২ | জরুরি সেবা: ৯৯৯',
      topbar_shop_phone: 'দোকান যোগাযোগ: ০১৭১৭-১০১৯১৯',
      topbar_timing: 'প্রতিদিন: সকাল ৯:০০ - রাত ১০:০০',
      nav_applications: 'অনলাইন আবেদন',
      nav_converter: 'বাংলা কনভার্টার',
      nav_print_studio: 'প্রিন্ট ও স্টুডিও',
      search_placeholder: 'যে কোনো সেবা খুঁজুন... (যেমন: নামজারি, খাজনা, খতিয়ান, চাকরির আবেদন)',
      search_btn: 'অনুসন্ধান',
      search_tag_all: 'সকল সেবা',
      search_tag_land: 'ভূমিসেবা',
      search_tag_jobs: 'চাকরির আবেদন',
      search_tag_converter: 'কনভার্টার',
      search_tag_print: 'প্রিন্ট ও ফটোস্ট্যাট',
      service_mutation_title: 'ই-নামজারি আবেদন ও ট্র্যাকিং',
      service_mutation_desc: 'অনলাইনে নামজারি আবেদন, খতিয়ান জমাভাগ ও ডিসিআর ফি পরিশোধের পূর্ণাঙ্গ সহায়তা।',
      service_ldtax_title: 'ভূমি উন্নয়ন কর (খাজনা পরিশোধ)',
      service_ldtax_desc: 'হোল্ডিং এন্ট্রি, বার্ষিক জমির খাজনা প্রদান ও তাৎক্ষণিক ডিজিটাল দাখিলা সংগ্রহ।',
      service_porcha_title: 'অনলাইন খতিয়ান ও মৌজা ম্যাপ (পর্চা)',
      service_porcha_desc: 'CS, SA, RS ও BS খতিয়ান অনুসন্ধান, সার্টিফাইড পর্চা ও ডিজিটাল ম্যাপ প্রাপ্তি।',
      service_jobs_title: 'চাকরির অনলাইন আবেদন ও এডমিট',
      service_jobs_desc: 'টেলিটক ও বিভিন্ন নিয়োগ পরীক্ষার নির্ভুল ফরম পূরণ, ছবি-স্বাক্ষর রিসাইজ ও এডমিট কার্ড।',
      service_converter_title: 'ইউনিকোড ⇄ বিজয় বাংলা কনভার্টার',
      service_converter_desc: 'ফন্ট রূপান্তর, মাইক্রোসফট ওয়ার্ড ইকুয়েশন, গণিত ফর্মুলা ও এআই ওসিআর ইঞ্জিন।',
      service_photostat_title: 'ছবি প্রিন্ট, ফটোকপি ও ল্যামিনেশন',
      service_photostat_desc: 'এইচডি কালার ছবি, হাই-স্পিড ডিজিটাল ফটোকপি, কম্পিউটার কম্পোজ ও প্লাস্টিক ল্যামিনেশন।',
      service_registration_title: 'জন্ম-মৃত্যু নিবন্ধন ও সংশোধন',
      service_registration_desc: 'নতুন জন্ম ও মৃত্যু সনদের অনলাইন আবেদন, তথ্য সংশোধন ও ভেরিফাইড প্রিন্ট কপি।',
      service_results_title: 'পরীক্ষার রেজাল্ট ও মার্কশিট প্রিন্ট',
      service_results_desc: 'SSC, HSC, সমমান ও জাতীয় বিশ্ববিদ্যালয়ের ফলাফল অনুসন্ধান ও মার্কশিট প্রিন্ট।',
      service_btn_details: 'সেবা গ্রহণ করুন →',
      service_sec_tag: 'সেবাসমূহ',
      service_sec_title: 'নাগরিক ও ডিজিটাল সেবাসমূহ',
      service_sec_subtitle: 'ভূমি মন্ত্রণালয় অনুমোদিত কেন্দ্র থেকে স্বচ্ছ ও নির্ভরযোগ্য সেবা সমাধান',
      nav_about: 'আমাদের সম্পর্কে',
      about_intro: 'কেন্দ্র পরিচিতি ও লক্ষ্য',
      about_facilities: 'নাগরিক সুবিধা ও সেবা',
      about_license: 'অনুমোদন ও সনদ',
      nav_login: 'লগইন',

      // Footer
      footer_desc: 'সরকার অনুমোদিত ডিজিটাল ও উন্মুক্ত ভূমিসেবা কেন্দ্র (LSFC)। অনুমোদন নং: দিনাজ/ফুল/এলএসএসএফসি-০৭/২০২৫।',
      footer_rights: '© ২০২৬ ফয়জার কম্পিউটার এন্ড ফটোস্ট্যাট। সর্বস্বত্ব সংরক্ষিত।',
      footer_approval: 'সরকারি নির্দেশিকা ও ফি তালিকাভুক্ত',
      footer_proprietor: 'মোঃ ফয়জার আলী',

      // --- Subpages Comprehensive Translations (bn) ---
      // results.html
      results_badge: 'ড্রিমল্যান্ড রেসিডেন্সিয়াল মডেল স্কুল',
      results_title: 'অনলাইন রেজাল্ট ও মার্কশীট অনুসন্ধান',
      results_subtitle: 'পরীক্ষার সাল, পরীক্ষার নাম, শ্রেণি এবং রোল নম্বর ইনপুট দিয়ে তাৎক্ষণিক বিষয়ভিত্তিক ফলাফল ও অফিশিয়াল মার্কশীট দেখুন।',
      results_lbl_inst: 'প্রতিষ্ঠান নির্বাচন (Select Institution)',
      results_opt_inst: '-- প্রতিষ্ঠান নির্বাচন করুন --',
      results_lbl_year: 'পরীক্ষার সাল',
      results_opt_year: '-- সাল নির্বাচন করুন --',
      results_lbl_exam: 'পরীক্ষার নাম',
      results_opt_exam: '-- পরীক্ষার নাম নির্বাচন করুন --',
      results_lbl_class: 'শ্রেণি ও শাখা',
      results_opt_class: '-- শ্রেণি ও শাখা নির্বাচন করুন --',
      results_lbl_roll: 'রোল নম্বর',
      results_roll_placeholder: 'যেমন: 1, 2, 10',
      results_tip: 'টিপস: শ্রেণি নির্বাচন করে সরাসরি রোল নম্বর লিখে খুঁজুন।',
      results_btn_reset: 'রিসেট',
      results_btn_search: 'ফলাফল দেখুন',
      results_tab_marksheet: 'একাডেমিক ট্রান্সক্রিপ্ট / মার্কশীট',
      results_tab_merit: 'পূর্ণাঙ্গ মেধাতালিকা',
      results_tab_stats: 'ফলাফল পরিসংখ্যান',
      results_btn_print: 'মার্কশীট প্রিন্ট করুন (A4)',
      results_btn_download: 'ডাউনলোড',
      results_tbl_sl: 'ক্রমিক',
      results_tbl_subject: 'বিষয়ের নাম',
      results_tbl_total: 'মোট নম্বর',
      results_tbl_obtained: 'প্রাপ্ত নম্বর',
      results_tbl_grade: 'লেটার গ্রেড',
      results_tbl_point: 'গ্রেড পয়েন্ট',

      // notices.html
      notices_page_badge: '📢 লাইভ বুলেটিন বোর্ড • দৈনিক আপডেট',
      notices_page_title: 'চলমান সরকারি চাকরি ও স্কুল-কলেজ সংক্রান্ত নোটিশ',
      notices_page_subtitle: 'ফুলবাড়ী সরকারি কলেজ সহ স্থানীয় শিক্ষার্থী ও চাকরিপ্রার্থীদের জন্য নিয়মিত হালনাগাদকৃত সার্কুলার, পরীক্ষার সময়সূচী এবং আবেদনের শেষ তারিখের আপডেট।',
      notices_search_placeholder: 'পদ, প্রতিষ্ঠান বা বিষয় দিয়ে খুঁজুন...',
      notices_tab_college: 'স্কুল-কলেজ সংক্রান্ত নোটিশ',
      notices_tab_jobs: 'চাকুরির সার্কুলার',
      notices_tab_all: 'সকল নোটিশ',
      notices_status_autocycle: 'ক্যাটাগরি স্বয়ংক্রিয়ভাবে পরিবর্তিত হচ্ছে (প্রতি ৫ সে.)',
      notices_status_pause: 'যেকোনো বাটনে ক্লিক বা সার্চ করলে পরিবর্তন থেমে থাকবে',
      notices_btn_apply_direct: 'অনলাইনে সরাসরি আবেদন / সার্কুলার',
      notices_btn_details: 'বিস্তারিত দেখুন',
      notices_btn_whatsapp: 'সরাসরি আবেদন পাঠান',
      notices_modal_title: 'বিজ্ঞপ্তির বিস্তারিত বিবরণ',
      notices_modal_deadline: 'আবেদনের শেষ তারিখ:',
      notices_modal_vacancies: 'পদসংখ্যা:',
      notices_modal_req: 'প্রয়োজনীয় যোগ্যতা:',
      notices_modal_btn_apply: 'অনলাইনে সরাসরি আবেদন / সার্কুলার লিংক',
      notices_modal_btn_wa: 'হোয়াটসঅ্যাপে ডকুমেন্টস পাঠিয়ে আবেদন করুন',

      // services.html
      services_page_badge: 'স্বীকৃত ভূমিসেবা ও ডিজিটাল সমাধান কেন্দ্র',
      services_page_title: 'আমাদের সকল ডিজিটাল, ভূমিসেবা ও স্টুডিও সেবাসমূহ',
      services_page_subtitle: 'ভূমি মন্ত্রণালয় অনুমোদিত উন্মুক্ত কেন্দ্র (LSFC) থেকে স্বচ্ছ সরকারি ফি ও দ্রুততম সময়ে নির্ভরযোগ্য নাগরিক সেবা সমাধান।',
      services_search_placeholder: '১৯টি সেবার যেকোনোটি নাম বা বিষয় দিয়ে খুঁজুন...',
      services_tab_all: 'সকল সেবা (১৯টি)',
      services_tab_land: 'ডিজিটাল ভূমিসেবা',
      services_tab_digital: 'নাগরিক অনলাইন সেবা',
      services_tab_student: 'শিক্ষার্থী ও চাকরি সেবা',
      services_tab_banking: 'ব্যাংকিং ও বিল পেমেন্ট',
      services_tab_studio: 'প্রিন্ট, স্টুডিও ও ডিজাইন',
      services_checklist_tag: 'স্বচ্ছ ফি ও চেকলিস্ট',
      services_checklist_title: 'সেবামূল্য ও প্রয়োজনীয় কাগজপত্র চেকলিস্ট',
      services_checklist_subtitle: 'দোকানে আসার আগেই যেকোনো সেবা নির্বাচন করে জেনে নিন সরকারি ফি, কম্পিউটার চার্জ এবং সাথে আনার প্রয়োজনীয় কাগজপত্র।',
      services_lbl_govt_fee: 'সরকারি ফি:',
      services_lbl_shop_fee: 'দোকানের চার্জ:',
      services_lbl_duration: 'আনুমানিক সময়:',
      services_lbl_required_docs: 'প্রয়োজনীয় কাগজপত্রসমূহ:',
      services_btn_view_modal: 'বিস্তারিত ও আবেদন প্রক্রিয়া',
      services_btn_call_now: 'পরামর্শ ও বুকিং কল করুন',

      // portal.html
      portal_page_badge: 'ফয়জার ডিজিটাল জব পোর্টাল v2.0 • ক্লাউড প্রোফাইল হাব',
      portal_page_title: 'চাকরি প্রার্থীদের স্মার্ট ক্লাউড প্রোফাইল ও অটো-ফিল পোর্টাল',
      portal_page_subtitle: 'আপনার আবেদন তথ্য, ঠিকানা, শিক্ষাগত যোগ্যতা ও ছবি-স্বাক্ষর একবার ক্লাউডে সংরক্ষণ করে যেকোনো সরকারি চাকুরির আবেদনে ১-ক্লিকে সেকেন্ডে নির্ভুল পূরণ করুন!',
      portal_calc_tag: 'স্মার্ট ফি ক্যালকুলেটর',
      portal_calc_title: 'ভূমি উন্নয়ন কর ও নামজারি ফি ক্যালকুলেটর',
      portal_mutation_step1: 'ধাপ ১: খতিয়ান ও দলিল যাচাই',
      portal_mutation_step2: 'ধাপ ২: অনলাইন আবেদন ও ফি পরিশোধ',
      portal_mutation_step3: 'ধাপ ৩: শুনানি ও খতিয়ান সংগ্রহ',

      // converter.html
      converter_page_badge: '১০০% অফলাইন • আল্ট্রা-ফাস্ট বাংলা ও সমীকরণ কনভার্টার',
      converter_page_title: 'ইউনিকোড ⇄ বিজয় বাংলা কনভার্টার ও ল্যাটেক্স ওওসিআর',
      converter_page_subtitle: 'সুতন্বীএমজে, ইউনিকোড, এমএস ওয়ার্ড ও ম্যাথ সমীকরণ নির্ভেজালভাবে রূপান্তর ও অফলাইনে DOCX আকারে সেভ করুন।',
      converter_btn_uni_to_bijoy: 'ইউনিকোড ➔ বিজয়',
      converter_btn_bijoy_to_uni: 'বিজয় ➔ ইউনিকোড',
      converter_btn_copy: 'কপি করুন',
      converter_btn_clear: 'মুছে ফেলুন',
      converter_btn_docx: 'DOCX ডাউনলোড',
      converter_input_lbl: 'ইনপুট টেক্সট (বাংলা অথবা বিজয় টাইপ করুন):',
      converter_output_lbl: 'রূপান্তরিত ফলাফল:',
      converter_stats_words: 'শব্দ:',
      converter_stats_chars: 'অক্ষর:',

      // tools.html
      tools_page_badge: 'নাগরিক ও চাকরিপ্রার্থীদের জন্য ডিজিটাল টুলস',
      tools_page_title: 'সরকারি চাকরির অনলাইন আবেদন ও ফটো রিসাইজার টুলস',
      tools_page_subtitle: 'টেলিটক ও সরকারি চাকরির জন্য নির্দিষ্ট ৩০০×৩০০ ফটো, ৩০০×৮০ স্বাক্ষর রিসাইজিং এবং ফাইল প্রসেসিং টুলস।',
      tools_photo_title: 'টেলিটক ছবি রিসাইজার (৩০০×৩০০)',
      tools_photo_desc: 'ফাইলের সাইজ সর্বোচ্চ ১০০ কেবি এবং রেজোলিউশন ৩০০×৩০০ পিক্সেলে স্বয়ংক্রিয়ভাবে রূপান্তর।',
      tools_sig_title: 'স্বাক্ষর রিসাইজার (৩০০×৮০)',
      tools_sig_desc: 'ফাইলের সাইজ সর্বোচ্চ ৬০ কেবি এবং রেজোলিউশন ৩০০×৮০ পিক্সেলে নিখুঁত কনভার্ট।',
      tools_btn_upload: 'ছবি নির্বাচন করুন',
      tools_btn_download: 'রিসাইজড ছবি ডাউনলোড করুন',
      tools_age_title: 'সরকারি চাকরির বয়স ক্যালকুলেটর',
      tools_age_desc: 'নির্ধারিত তারিখে প্রার্থীর বয়স কত বছর, মাস ও দিন তা নিমেষেই হিসাব করুন।',
      tools_btn_calc_age: 'বয়স বের করুন',

      // contact.html
      contact_page_badge: 'সরাসরি সেবা ও অবস্থান',
      contact_page_title: 'যোগাযোগ ও সার্ভিস সেন্টার পরিদর্শন',
      contact_page_subtitle: 'যেকোনো ডিজিটাল সেবা, ভূমিসেবা পরামর্শ বা জরুরি প্রিন্টিং সহায়তায় আমাদের দোকানে সরাসরি আসুন বা ফোনে যোগাযোগ করুন।',
      contact_card_address_title: 'আমাদের ঠিকানা',
      contact_address_text: 'ফুলবাড়ী সরকারি কলেজ গেটের পশ্চিম পার্শ্বে, ফুলবাড়ী, দিনাজপুর-৫২৬০',
      contact_card_hours_title: 'সেবা প্রদানের সময়সূচী',
      contact_hours_weekdays: 'শনিবার - বৃহস্পতিবার: সকাল ১০:০০ - রাত ৯:০০',
      contact_hours_friday: 'শুক্রবার: বিকাল ৪:০০ - রাত ৯:০০',
      contact_card_phone_title: 'হটলাইন ও হোয়াটসঅ্যাপ',
      contact_form_title: 'সরাসরি বার্তা পাঠান',
      contact_form_name: 'আপনার নাম',
      contact_form_phone: 'মোবাইল নম্বর',
      contact_form_subject: 'সেবার বিষয়',
      contact_form_message: 'বিস্তারিত বার্তা',
      contact_btn_send: 'মেসেজ পাঠান'
    },

    en: {
      // Top Bar
      top_phone: '+880 1717-101919',
      top_location: 'Phulbari Govt. College Gate, Dinajpur',
      top_hours: 'Sat - Thu: 10:00 AM - 9:00 PM | Fri: 4:00 PM - 9:00 PM',
      top_hotline: 'Land Hotline: 16122 | Emergency: 999',
      topbar_tagline: 'Smart Land & Citizen Digital Assistance Centre',
      topbar_status: 'Open Now (until 9:00 PM)',
      theme_day: 'Day Mode',
      theme_night: 'Night Mode',
      lang_label: 'English',

      // Brand
      brand_name: 'Fayzar Computer',
      brand_sub: 'Digital & Land Services Centre',
      brand_domain: 'fayzarcomputer.com.bd',

      // 8-Item Sequential Navigation Menu
      nav_home: 'Home',
      nav_land: 'Land Services',
      nav_services: 'Other Services',
      nav_notices: 'Job Circulars',
      nav_tools: 'Converter & Tools',
      nav_results: 'Results',
      nav_links: 'Useful Links',
      nav_contact: 'Contact',
      nav_cta: 'Get Services',
      nav_services_short: 'Services',
      nav_jobs_short: 'Jobs',
      nav_converter_short: 'Converter',
      nav_tools_short: 'Tools',
      nav_results_short: 'Results',
      nav_contact_short: 'Contact',

      // Hero Section
      hero_badge: 'Govt. Authorized Land Services Facilitating Centre (LSFC: 07/2025)',
      hero_title: 'Fayzar Computer & Photostat',
      hero_domain: 'fayzarcomputer.com.bd',
      hero_subtitle: 'Your Trusted Digital, Online & Land Services Centre',
      hero_description: 'Official E-Mutation, Land Tax & Porcha services alongside Govt Job Applications, University Admissions, Teletalk Image Resizing & Digital Printing.',
      hero_btn_services: 'Our Services',
      hero_btn_converter: 'Converter & Tools',

      // 4-Column Core Solutions Grid
      grid_tag: 'Core Services Gateway',
      grid_title: 'Specialized Digital Services for You',
      grid_subtitle: 'Fast, compliant, and dependable computer & land citizen assistance',

      card1_badge: 'Land Services',
      card1_title: 'Digital Land Services',
      card1_desc: 'Khatian search, porcha records, e-mutation and land tax payment',
      card1_link: 'Learn More →',

      card2_badge: 'Online',
      card2_title: 'Online Citizen Applications',
      card2_desc: 'Govt jobs, admission, NID, passport, driving license & e-tax filing',
      card2_link: 'Learn More →',

      card3_badge: 'Typing & Compose',
      card3_title: 'Document Typing & Composing',
      card3_desc: 'Fast Bengali & English typing, legal petitions & document formatting',
      card3_link: 'Learn More →',
      card3_btn_quick: '⚡ Open Unicode ⇄ Bijoy Converter',

      card4_badge: 'Print & Studio',
      card4_title: 'Printing & Digital Photostat',
      card4_desc: 'High-speed digital photocopy, color print, lamination & passport photos',
      card4_link: 'Learn More →',

      // Land Services Spotlight
      land_tag: 'Specialized Facilitation',
      land_title: 'Smart Land Services & Citizen Assistance',
      land_subtitle: 'Accurate, transparent, and hassle-free support from certified land experts',
      land_mutation_title: 'E-Mutation & Khatian',
      land_mutation_desc: 'New khatian creation and status tracking for purchased or inherited land.',
      land_tax_title: 'Online Land Tax (LD-Tax)',
      land_tax_desc: 'Holding registration, annual land tax payment, and instant digital receipt.',
      land_khatian_title: 'Porcha & Mouza Maps',
      land_khatian_desc: 'CS, SA, RS record verification and certified copy postal delivery.',
      land_btn_apply: 'Apply Online →',
      land_btn_pay: 'Pay Tax →',
      land_btn_search: 'Search Porcha →',
      land_view_all: 'View All Land Services →',

      // Live Circulars Section
      notices_tag: 'Recent Circulars',
      notices_title: 'Latest Job & Admission Notices',
      notices_subtitle: 'Latest government recruitment deadlines and university admission updates',
      notices_view_all: 'View All Notices',
      notice_apply_online: 'Apply Online →',
      notice_apply_shop: 'Apply from Shop',
      notice_vacancies_lbl: 'Vacancies:',
      notice_deadline_lbl: 'Deadline:',

      // Useful Web Links
      links_tag: 'Government & Educational Portals',
      links_title: 'Essential Government & Citizen Portals',
      links_subtitle: 'One-click direct access to major Bangladesh government and public service portals',
      links_cat_land: 'Land Portals',
      links_cat_job: 'Job & Recruitment Portals',
      links_cat_citizen: 'Citizen Service Portals',
      links_cat_edu: 'Education & Result Portals',
      link_mutation: 'E-Mutation Portal',
      link_ldtax: 'Land Tax (LD-Tax)',
      link_eporcha: 'Online Khatian (e-Porcha)',
      link_dlrs: 'Mouza Map Portal (DLRS)',
      link_land_help: 'National Land Helpline: 16122',
      link_alljobs: 'Teletalk AllJobs',
      link_bpsc: 'Public Service Commission (BPSC)',
      link_dpe: 'Directorate of Primary Education',
      link_bb: 'Bangladesh Bank E-Recruitment',
      link_job_help: 'Online Application Assistance',
      link_nid: 'NID Citizen Services',
      link_epassport: 'E-Passport Portal',
      link_pcc: 'Police Clearance (PCC)',
      link_etax: 'Online Tax e-Return (NBR)',
      link_citizen_help: 'Govt Fee & Chalan Solution',
      link_nu: 'National University Admission',
      link_eduboard: 'Education Board Results',
      link_phulbari_col: 'Phulbari Govt. College Notice',
      link_bteb: 'Technical Education Board (BTEB)',
      link_edu_help: 'Admission & Result Marksheet Print',

      // Customer Reviews & Testimonials
      reviews_tag: 'Customer Reviews',
      reviews_title: 'What Our Valued Clients Say',
      reviews_subtitle: 'Trusted by citizens of Phulbari for accurate and prompt digital services',
      review1_name: 'Mahmudul Hasan',
      review1_role: 'University Student',
      review1_service: 'Online Admissions & Forms',
      review1_text: 'Excellent and cordial service. They resized my photo and signature flawlessly and submitted the job application on time.',
      review2_name: 'Md. Anwarul Islam',
      review2_role: 'Business Owner & Landholder',
      review2_service: 'Digital Land Services',
      review2_text: 'Processed my land E-Mutation application and tracking in record time. A truly dependable service centre in Phulbari.',
      review3_name: 'Rabeya Khatun',
      review3_role: 'Primary Teacher Candidate',
      review3_service: 'Teletalk Application & Admit',
      review3_text: 'Got my primary teacher recruitment application and admit card printed without any errors. Highly recommended!',

      // Contact & Footer
      contact_tag: 'Our Location',
      contact_title: 'Visit Our Service Centre',
      contact_subtitle: 'West side of Phulbari Govt. College Gate, Phulbari, Dinajpur',
      contact_phone_lbl: 'Phone Number:',
      contact_whatsapp_lbl: 'WhatsApp Chat:',
      contact_hours_lbl: 'Opening Hours:',
      footer_desc: 'Government Authorized Land Services Facilitating Centre (LSFC) and Premier Digital Service Provider in Phulbari, Dinajpur.',
      footer_col_services: 'Featured Services',
      footer_col_links: 'Quick Links',
      footer_col_helpline: 'Emergency Hotlines',
      footer_quick_nav: 'Quick Navigation',
      footer_tools_title: 'Tools & Portals',
      footer_tool_converter: 'Unicode ⇄ Bijoy Converter',
      footer_tool_equation: 'Word EQ & LaTeX Converter',
      footer_tool_ocr: 'AI OCR Question Paper Converter',
      footer_tool_resizer: 'Teletalk Photo & Signature Resizer',
      footer_admin: 'Admin Panel',
      footer_proprietor: 'Proprietor: Md. Fayzar Ali',
      footer_approval: 'Govt Approval No: Dinaj/Phul/LSFC-07/2025',
      footer_rights: '© 2026 All Rights Reserved. Fayzar Computer & Photostat.',
      footer_address_line: 'Phulbari Govt. College Gate, Phulbari, Dinajpur | Phone: 01717-101919',
      btn_whatsapp: 'Message on WhatsApp',
      btn_call_now: 'Call Directly',
      btn_apply_online: 'Online Application Link →',
      btn_apply_shop: 'Apply at Shop',
      notice_vacancies: 'Vacancies:',
      notice_deadline: 'Deadline:',

      // Land.gov.bd Inspired Redesign Keys
      topbar_helpline: 'Land Helpline: 16122 | Emergency: 999',
      topbar_shop_phone: 'Shop Hotline: 01717-101919',
      topbar_timing: 'Daily: 9:00 AM - 10:00 PM',
      nav_applications: 'Online Applications',
      nav_converter: 'Bangla Converter',
      nav_print_studio: 'Print & Studio',
      search_placeholder: 'Search any service... (e.g. Mutation, Land Tax, Khatian, Job Apply)',
      search_btn: 'Search',
      search_tag_all: 'All Services',
      search_tag_land: 'Land Services',
      search_tag_jobs: 'Job Applications',
      search_tag_converter: 'Converter',
      search_tag_print: 'Print & Photostat',
      service_mutation_title: 'E-Mutation & Tracking',
      service_mutation_desc: 'Online mutation application, khatian partition & DCR fee payment support.',
      service_ldtax_title: 'Land Development Tax (LD-Tax)',
      service_ldtax_desc: 'Citizen holding entry, annual land tax payment & instant digital receipt.',
      service_porcha_title: 'Online Khatian & Mouza Map',
      service_porcha_desc: 'CS, SA, RS & BS record search, certified porcha copy & digital maps.',
      service_jobs_title: 'Online Job Application & Admit',
      service_jobs_desc: 'Error-free Teletalk form filling, photo-signature resizing & admit card download.',
      service_converter_title: 'Unicode ⇄ Bijoy Converter',
      service_converter_desc: 'Font conversion, Word Equation & LaTeX math, and AI question OCR engine.',
      service_photostat_title: 'Photo Print & Digital Photostat',
      service_photostat_desc: 'HD color photo printing, high-speed photostat, compose & plastic lamination.',
      service_registration_title: 'Birth & Death Registration',
      service_registration_desc: 'Online certificate application, correction & verified printout service.',
      service_results_title: 'Exam Results & Marksheets',
      service_results_desc: 'SSC, HSC, Madrasah & National University results lookup with full marksheet.',
      service_btn_details: 'Access Service →',
      service_sec_tag: 'Services',
      service_sec_title: 'Citizen & Digital Services',
      service_sec_subtitle: 'Transparent and dependable digital services from govt approved center',
      nav_about: 'About Us',
      about_intro: 'Overview & Goals',
      about_facilities: 'Citizen Services',
      about_license: 'Licensing & Approval',
      nav_login: 'Login',

      // Footer
      footer_desc: 'Govt. Authorized Digital & Land Services Centre (LSFC). Approval No: Dinaj/Phul/LSFC-07/2025.',
      footer_rights: '© 2026 Fayzar Computer & Photostat. All rights reserved.',
      footer_approval: 'Govt Guidelines & Regulated Fees',
      footer_proprietor: 'Md. Fayzar Ali',

      // --- Subpages Comprehensive Translations (en) ---
      // results.html
      results_badge: 'Dreamland Residential Model School',
      results_title: 'Online Result & Marksheet Search Portal',
      results_subtitle: 'Instant subject-wise results and official marksheet lookup with exam year, exam name, class and roll number.',
      results_lbl_inst: 'Select Institution',
      results_opt_inst: '-- Select Institution --',
      results_lbl_year: 'Exam Year',
      results_opt_year: '-- Select Year --',
      results_lbl_exam: 'Exam Name',
      results_opt_exam: '-- Select Exam --',
      results_lbl_class: 'Class & Section',
      results_opt_class: '-- Select Class & Section --',
      results_lbl_roll: 'Roll Number',
      results_roll_placeholder: 'e.g. 1, 2, 10',
      results_tip: 'Tip: Select class and enter roll number directly to search.',
      results_btn_reset: 'Reset',
      results_btn_search: 'View Result',
      results_tab_marksheet: 'Academic Transcript / Marksheet',
      results_tab_merit: 'Full Merit List',
      results_tab_stats: 'Result Statistics',
      results_btn_print: 'Print Marksheet (A4)',
      results_btn_download: 'Download',
      results_tbl_sl: 'SL',
      results_tbl_subject: 'Subject Name',
      results_tbl_total: 'Total Marks',
      results_tbl_obtained: 'Obtained',
      results_tbl_grade: 'Letter Grade',
      results_tbl_point: 'Grade Point',

      // notices.html
      notices_page_badge: '📢 Live Bulletin Board • Daily Updates',
      notices_page_title: 'Ongoing Government Jobs & Academic Notices',
      notices_page_subtitle: 'Regularly updated circulars, exam routines and application deadlines for students of Phulbari Govt College and job seekers.',
      notices_search_placeholder: 'Search by post, institution or topic...',
      notices_tab_college: 'Academic & College Notices',
      notices_tab_jobs: 'Job Circulars',
      notices_tab_all: 'All Notices',
      notices_status_autocycle: 'Categories auto-cycling (every 5s)',
      notices_status_pause: 'Auto-cycle pauses on click or search',
      notices_btn_apply_direct: 'Direct Online Application / Circular',
      notices_btn_details: 'View Details',
      notices_btn_whatsapp: 'Apply via WhatsApp',
      notices_modal_title: 'Notice Details',
      notices_modal_deadline: 'Application Deadline:',
      notices_modal_vacancies: 'Vacancies:',
      notices_modal_req: 'Required Qualifications:',
      notices_modal_btn_apply: 'Direct Online Application / Circular Link',
      notices_modal_btn_wa: 'Send Documents & Apply via WhatsApp',

      // services.html
      services_page_badge: 'Certified Land & Digital Solutions Centre',
      services_page_title: 'All Digital, Land & Studio Services',
      services_page_subtitle: 'Transparent government fees and fastest dependable citizen service solutions from LSFC certified center.',
      services_search_placeholder: 'Search any of 19 services by name or keyword...',
      services_tab_all: 'All Services (19)',
      services_tab_land: 'Digital Land Services',
      services_tab_digital: 'Citizen Online Services',
      services_tab_student: 'Student & Job Services',
      services_tab_banking: 'Banking & Bill Payment',
      services_tab_studio: 'Print, Studio & Design',
      services_checklist_tag: 'Transparent Fees & Checklist',
      services_checklist_title: 'Service Pricing & Document Checklist',
      services_checklist_subtitle: 'Before visiting our shop, select any service to verify official government fee, computer charges and required documents.',
      services_lbl_govt_fee: 'Government Fee:',
      services_lbl_shop_fee: 'Shop Charge:',
      services_lbl_duration: 'Estimated Time:',
      services_lbl_required_docs: 'Required Documents:',
      services_btn_view_modal: 'Details & Application Process',
      services_btn_call_now: 'Call for Consultation',

      // portal.html
      portal_page_badge: 'Fayzar Digital Job Portal v2.0 • Cloud Profile Hub',
      portal_page_title: 'Smart Cloud Profile & Job Auto-Fill Portal',
      portal_page_subtitle: 'Save your profile, address, education, and photo-signature once in cloud to auto-fill government and Teletalk job applications in 1 click!',
      portal_calc_tag: 'Smart Fee Calculator',
      portal_calc_title: 'Land Tax & Mutation Fee Calculator',
      portal_mutation_step1: 'Step 1: Khatian & Deed Verification',
      portal_mutation_step2: 'Step 2: Online Filing & Fee Payment',
      portal_mutation_step3: 'Step 3: Hearing & Khatian Collection',

      // converter.html
      converter_page_badge: '100% Offline • Ultra-Fast Bangla & Equation Converter',
      converter_page_title: 'Unicode ⇄ Bijoy Bangla Converter & LaTeX OCR',
      converter_page_subtitle: 'Flawlessly convert SutonnyMJ, Unicode, MS Word and Math equations with offline native DOCX export.',
      converter_btn_uni_to_bijoy: 'Unicode ➔ Bijoy',
      converter_btn_bijoy_to_uni: 'Bijoy ➔ Unicode',
      converter_btn_copy: 'Copy Text',
      converter_btn_clear: 'Clear All',
      converter_btn_docx: 'Export DOCX',
      converter_input_lbl: 'Input Text (Type Bangla or Bijoy):',
      converter_output_lbl: 'Converted Output:',
      converter_stats_words: 'Words:',
      converter_stats_chars: 'Characters:',

      // tools.html
      tools_page_badge: 'Digital Tools for Citizens & Applicants',
      tools_page_title: 'Online Job Application & Photo Resizer Tools',
      tools_page_subtitle: 'Standard 300x300 photo resizer, 300x80 signature resizer and document processing tools for job applications.',
      tools_photo_title: 'Teletalk Photo Resizer (300x300)',
      tools_photo_desc: 'Automatically resize image to exact 300x300 pixels with maximum file size under 100 KB.',
      tools_sig_title: 'Signature Resizer (300x80)',
      tools_sig_desc: 'Precisely resize signature to 300x80 pixels with maximum file size under 60 KB.',
      tools_btn_upload: 'Choose Image',
      tools_btn_download: 'Download Resized Image',
      tools_age_title: 'Govt Job Age Calculator',
      tools_age_desc: 'Instantly calculate candidate exact age in years, months and days as of application date.',
      tools_btn_calc_age: 'Calculate Age',

      // contact.html
      contact_page_badge: 'Direct Services & Location',
      contact_page_title: 'Contact & Visit Service Centre',
      contact_page_subtitle: 'Visit our center directly or contact via phone for digital assistance, land advice or express printing services.',
      contact_card_address_title: 'Our Address',
      contact_address_text: 'West Side of Phulbari Govt. College Gate, Phulbari, Dinajpur-5260',
      contact_card_hours_title: 'Opening Hours',
      contact_hours_weekdays: 'Saturday - Thursday: 10:00 AM - 9:00 PM',
      contact_hours_friday: 'Friday: 4:00 PM - 9:00 PM',
      contact_card_phone_title: 'Hotline & WhatsApp',
      contact_form_title: 'Send Direct Message',
      contact_form_name: 'Your Name',
      contact_form_phone: 'Mobile Number',
      contact_form_subject: 'Service Subject',
      contact_form_message: 'Detailed Message',
      contact_btn_send: 'Send Message'
    }
  };

  // =========================================================================
  // 2. State Management & Time-Based Theme Engine
  // =========================================================================
  let currentLang = localStorage.getItem('fayzar_lang') || 'bn';

  function getTimeBasedTheme() {
    const hour = new Date().getHours();
    // Daytime: 06:00 to 17:59 (6:00 AM - 5:59 PM) -> 'light' (Day Mode)
    // Nighttime: 18:00 to 05:59 (6:00 PM - 5:59 AM) -> 'dark' (Night Mode)
    return (hour >= 6 && hour < 18) ? 'light' : 'dark';
  }

  function determineInitialTheme() {
    const sessionManual = sessionStorage.getItem('fayzar_theme_manual');
    const savedManualTheme = localStorage.getItem('fayzar_theme_manual');
    const manualTime = parseInt(localStorage.getItem('fayzar_theme_manual_time') || '0', 10);
    const elapsedHours = (Date.now() - manualTime) / (1000 * 60 * 60);

    // If user explicitly toggled during this browsing session or recently (within 4 hours)
    if (sessionManual === 'true' && savedManualTheme) {
      return savedManualTheme;
    }
    if (savedManualTheme && elapsedHours < 4) {
      return savedManualTheme;
    }

    // Default to current local time of day (Day = light, Night = dark)
    return getTimeBasedTheme();
  }

  let currentTheme = determineInitialTheme();

  // Apply theme immediately to root to prevent screen flashing
  if (typeof document !== 'undefined' && document.documentElement) {
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // =========================================================================
  // 3. Theme Controller (Day ☀️ / Night 🌙)
  // =========================================================================
  function applyTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('fayzar_theme', theme);
    
    const root = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    const mobileThemeIcon = document.getElementById('mobile-theme-icon');
    const mobileThemeText = document.getElementById('mobile-theme-text');

    if (theme === 'dark') {
      root.classList.add('dark');
      if (themeIcon) themeIcon.className = 'fa-solid fa-sun text-amber-300';
      if (mobileThemeIcon) mobileThemeIcon.className = 'fa-solid fa-sun text-amber-400';
      const label = translations[currentLang] ? translations[currentLang].theme_day : 'ডে মোড';
      if (themeText) themeText.textContent = label;
      if (mobileThemeText) mobileThemeText.textContent = label;
    } else {
      root.classList.remove('dark');
      if (themeIcon) themeIcon.className = 'fa-solid fa-moon text-amber-300';
      if (mobileThemeIcon) mobileThemeIcon.className = 'fa-solid fa-moon text-indigo-600';
      const label = translations[currentLang] ? translations[currentLang].theme_night : 'নাইট মোড';
      if (themeText) themeText.textContent = label;
      if (mobileThemeText) mobileThemeText.textContent = label;
    }
  }

  function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    try {
      sessionStorage.setItem('fayzar_theme_manual', 'true');
      localStorage.setItem('fayzar_theme_manual', newTheme);
      localStorage.setItem('fayzar_theme_manual_time', Date.now().toString());
    } catch (e) {}
    applyTheme(newTheme);
  }

  // =========================================================================
  // 4. Language Controller (বাংলা ⇄ English)
  // =========================================================================
  function applyLanguage(lang) {
    if (!translations[lang]) lang = 'bn';
    currentLang = lang;
    localStorage.setItem('fayzar_lang', lang);

    const dict = translations[lang];

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // Update titles
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key]) {
        el.setAttribute('title', dict[key]);
      }
    });

    // Update Language Button Indicators
    const langBtnText = document.getElementById('lang-btn-text');
    const mobileLangBtnText = document.getElementById('mobile-lang-btn-text');
    if (langBtnText) {
      langBtnText.textContent = lang === 'bn' ? 'English' : 'বাংলা';
    }
    // Update [ বাং | EN ] pill indicators
    const btnBn = document.getElementById('lang-btn-bn');
    const btnEn = document.getElementById('lang-btn-en');
    if (btnBn && btnEn) {
      if (lang === 'bn') {
        btnBn.className = 'px-2 py-0.2 bg-emerald-800 text-white font-bold cursor-pointer transition';
        btnEn.className = 'px-2 py-0.2 bg-white text-emerald-800 font-bold hover:bg-emerald-50 cursor-pointer transition';
      } else {
        btnBn.className = 'px-2 py-0.2 bg-white text-emerald-800 font-bold hover:bg-emerald-50 cursor-pointer transition';
        btnEn.className = 'px-2 py-0.2 bg-emerald-800 text-white font-bold cursor-pointer transition';
      }
    }

    // Refresh theme labels based on current language
    applyTheme(currentTheme);

    // Dispatch global event for custom components
    window.dispatchEvent(new CustomEvent('fayzar:langchange', { detail: { lang: lang } }));
  }

  window.setLanguage = applyLanguage;

  function toggleLanguage() {
    applyLanguage(currentLang === 'bn' ? 'en' : 'bn');
  }

  // =========================================================================
  // 5. Expose Global Controller & Auto-Init
  // =========================================================================
  window.FayzarUI = {
    getLang: () => currentLang,
    getTheme: () => currentTheme,
    setLang: applyLanguage,
    setTheme: applyTheme,
    toggleLang: toggleLanguage,
    toggleTheme: toggleTheme,
    getTimeBasedTheme: getTimeBasedTheme,
    translations: translations
  };

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme);
    applyLanguage(currentLang);

    // Bind event listeners to UI toggles
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    const mobileThemeBtn = document.getElementById('mobile-theme-toggle-btn');
    if (mobileThemeBtn) mobileThemeBtn.addEventListener('click', toggleTheme);

    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) langBtn.addEventListener('click', toggleLanguage);

    const mobileLangBtn = document.getElementById('mobile-lang-toggle-btn');
    if (mobileLangBtn) mobileLangBtn.addEventListener('click', toggleLanguage);

    // Automatic time-based transition check every 60 seconds
    setInterval(() => {
      try {
        if (sessionStorage.getItem('fayzar_theme_manual') !== 'true') {
          const expected = getTimeBasedTheme();
          if (currentTheme !== expected) {
            applyTheme(expected);
          }
        }
      } catch (e) {}
    }, 60000);
  });
})();
