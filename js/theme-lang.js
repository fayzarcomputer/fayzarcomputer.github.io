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
      footer_proprietor: 'মোঃ ফয়জার আলী'
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
      footer_proprietor: 'Md. Fayzar Ali'
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
