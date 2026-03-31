export type Language = 'bn' | 'en';

export const translations = {
  bn: {
    // App
    appName: 'বাকি খাতা',
    appTagline: 'আপনার ব্যবসার বাকি হিসাব',

    // Navigation
    dashboard: 'ড্যাশবোর্ড',
    customers: 'গ্রাহক তালিকা',
    addCredit: 'বাকি যোগ করুন',
    recordPayment: 'পেমেন্ট রেকর্ড',
    analytics: 'বিশ্লেষণ',
    exportData: 'ডাটা এক্সপোর্ট',
    editProfile: 'প্রোফাইল সম্পাদনা',
    appInfo: 'অ্যাপ তথ্য',
    logout: 'লগআউট',

    // Auth
    login: 'লগইন',
    signup: 'সাইন আপ',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন',
    email: 'ইমেইল',
    phone: 'ফোন নম্বর',
    password: 'পাসওয়ার্ড',
    confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
    name: 'নাম',
    loginWith: 'ইমেইল বা ফোন দিয়ে লগইন',
    signupTitle: 'নতুন একাউন্ট তৈরি',
    loginTitle: 'আপনার একাউন্টে প্রবেশ',
    noAccount: 'একাউন্ট নেই?',
    hasAccount: 'ইতিমধ্যে একাউন্ট আছে?',

    // Dashboard
    totalCredit: 'মোট বাকি দেওয়া',
    totalPaid: 'মোট পরিশোধ',
    netDue: 'মোট বকেয়া',
    quickActions: 'দ্রুত কাজ',
    recentTransactions: 'সাম্প্রতিক লেনদেন',
    viewAll: 'সব দেখুন',
    addCreditBtn: 'বাকি যোগ করুন',
    paymentRecordBtn: 'পেমেন্ট রেকর্ড',
    totalCustomers: 'মোট গ্রাহক',
    noTransactions: 'কোনো লেনদেন নেই',

    // Customer
    customerList: 'গ্রাহক তালিকা',
    searchCustomer: 'গ্রাহক খুঁজুন...',
    newCustomer: 'নতুন গ্রাহক',
    customerCode: 'গ্রাহক কোড',
    due: 'বকেয়া',
    noCustomers: 'কোনো গ্রাহক নেই',

    // Customer Profile
    customerProfile: 'গ্রাহক প্রোফাইল',
    transactionHistory: 'লেনদেনের ইতিহাস',
    date: 'তারিখ',
    type: 'ধরন',
    amount: 'পরিমাণ',
    balance: 'জমা',
    credit: 'বাকি',
    payment: 'পেমেন্ট',
    addCreditForm: 'বাকি এন্ট্রি যোগ করুন',
    paymentForm: 'পেমেন্ট রেকর্ড করুন',
    currentDue: 'বর্তমান বকেয়া',

    // Add Credit
    customerName: 'গ্রাহকের নাম',
    selectCustomer: 'গ্রাহক বাছাই করুন',
    newCustomerLabel: 'নতুন গ্রাহক',
    existingCustomer: 'বিদ্যমান গ্রাহক',
    productName: 'পণ্যের নাম',
    creditAmount: 'বাকির পরিমাণ',
    creditDate: 'তারিখ',
    description: 'বিবরণ',
    saveCredit: 'বাকি সেভ করুন',
    creditAdded: 'বাকি সফলভাবে যোগ হয়েছে!',

    // Payment
    selectCustomerForPayment: 'পেমেন্টের জন্য গ্রাহক বাছাই',
    paymentAmount: 'পেমেন্টের পরিমাণ',
    savePayment: 'পেমেন্ট সেভ করুন',
    paymentRecorded: 'পেমেন্ট সফলভাবে রেকর্ড হয়েছে!',

    // Analytics
    totalTransactions: 'মোট লেনদেন',
    monthlySummary: 'মাসিক সারসংক্ষেপ',
    creditGiven: 'বাকি দেওয়া',
    paymentReceived: 'পেমেন্ট প্রাপ্ত',
    topDebtors: 'শীর্ষ বকেয়াদার গ্রাহক',
    rank: 'র‍্যাংক',

    // Export
    exportPDF: 'PDF ডাউনলোড',
    exportExcel: 'Excel ডাউনলোড',
    exportSuccess: 'ডাটা সফলভাবে ডাউনলোড হয়েছে!',

    // Profile
    editProfileTitle: 'প্রোফাইল সম্পাদনা',
    uploadPhoto: 'ছবি আপলোড',
    changePassword: 'পাসওয়ার্ড পরিবর্তন',
    oldPassword: 'পুরানো পাসওয়ার্ড',
    newPassword: 'নতুন পাসওয়ার্ড',
    saveChanges: 'পরিবর্তন সেভ করুন',
    profileUpdated: 'প্রোফাইল আপডেট হয়েছে!',
    passwordChanged: 'পাসওয়ার্ড পরিবর্তন হয়েছে!',

    // App Info
    appInfoTitle: 'অ্যাপ তথ্য',
    appVersion: 'সংস্করণ',
    appDescription:
      'বাকি খাতা হলো একটি সহজ ও কার্যকরী অ্যাপ যা আপনাকে আপনার ব্যবসার বাকি/পেমেন্ট হিসাব পরিচালনা করতে সাহায্য করে। আপনি সহজেই গ্রাহকের বাকি যোগ করতে, পেমেন্ট রেকর্ড করতে এবং বিশ্লেষণ দেখতে পারবেন।',
    developerInfo: 'ডেভেলপার তথ্য',
    developerName: 'Ronnie',
    developerEmail: 'ronniekhan77a@gmail.com',
    developerRole: 'সফটওয়্যার ডেভেলপার',

    // Common
    save: 'সেভ',
    cancel: 'বাতিল',
    delete: 'মুছুন',
    edit: 'সম্পাদনা',
    close: 'বন্ধ',
    back: 'ফিরে যান',
    loading: 'লোড হচ্ছে...',
    error: 'ত্রুটি',
    success: 'সফল',
    required: 'আবশ্যক',
    taka: '৳',

    // Dark mode
    darkMode: 'ডার্ক মোড',
    lightMode: 'লাইট মোড',
  },
  en: {
    // App
    appName: 'Baki Khata',
    appTagline: 'Your Business Credit Tracker',

    // Navigation
    dashboard: 'Dashboard',
    customers: 'Customers',
    addCredit: 'Add Credit',
    recordPayment: 'Record Payment',
    analytics: 'Analytics',
    exportData: 'Export Data',
    editProfile: 'Edit Profile',
    appInfo: 'App Info',
    logout: 'Logout',

    // Auth
    login: 'Login',
    signup: 'Sign Up',
    forgotPassword: 'Forgot Password',
    email: 'Email',
    phone: 'Phone',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    name: 'Name',
    loginWith: 'Login with Email or Phone',
    signupTitle: 'Create New Account',
    loginTitle: 'Sign in to your account',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',

    // Dashboard
    totalCredit: 'Total Credit',
    totalPaid: 'Total Paid',
    netDue: 'Net Due',
    quickActions: 'Quick Actions',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View All',
    addCreditBtn: 'Add Credit',
    paymentRecordBtn: 'Record Payment',
    totalCustomers: 'Total Customers',
    noTransactions: 'No transactions yet',

    // Customer
    customerList: 'Customer List',
    searchCustomer: 'Search customer...',
    newCustomer: 'New Customer',
    customerCode: 'Customer Code',
    due: 'Due',
    noCustomers: 'No customers yet',

    // Customer Profile
    customerProfile: 'Customer Profile',
    transactionHistory: 'Transaction History',
    date: 'Date',
    type: 'Type',
    amount: 'Amount',
    balance: 'Balance',
    credit: 'Credit',
    payment: 'Payment',
    addCreditForm: 'Add Credit Entry',
    paymentForm: 'Record Payment',
    currentDue: 'Current Due',

    // Add Credit
    customerName: 'Customer Name',
    selectCustomer: 'Select Customer',
    newCustomerLabel: 'New Customer',
    existingCustomer: 'Existing Customer',
    productName: 'Product Name',
    creditAmount: 'Credit Amount',
    creditDate: 'Date',
    description: 'Description',
    saveCredit: 'Save Credit',
    creditAdded: 'Credit added successfully!',

    // Payment
    selectCustomerForPayment: 'Select Customer for Payment',
    paymentAmount: 'Payment Amount',
    savePayment: 'Save Payment',
    paymentRecorded: 'Payment recorded successfully!',

    // Analytics
    totalTransactions: 'Total Transactions',
    monthlySummary: 'Monthly Summary',
    creditGiven: 'Credit Given',
    paymentReceived: 'Payment Received',
    topDebtors: 'Top Debtors',
    rank: 'Rank',

    // Export
    exportPDF: 'Download PDF',
    exportExcel: 'Download Excel',
    exportSuccess: 'Data downloaded successfully!',

    // Profile
    editProfileTitle: 'Edit Profile',
    uploadPhoto: 'Upload Photo',
    changePassword: 'Change Password',
    oldPassword: 'Old Password',
    newPassword: 'New Password',
    saveChanges: 'Save Changes',
    profileUpdated: 'Profile updated!',
    passwordChanged: 'Password changed!',

    // App Info
    appInfoTitle: 'App Information',
    appVersion: 'Version',
    appDescription:
      'Baki Khata is a simple and effective app that helps you manage your business credit/payment accounts. You can easily add customer credits, record payments, and view analytics.',
    developerInfo: 'Developer Info',
    developerName: 'Ronnie',
    developerEmail: 'ronniekhan77a@gmail.com',
    developerRole: 'Software Developer',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    required: 'Required',
    taka: '৳',

    // Dark mode
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
  },
} as const;

export type TranslationKey = keyof typeof translations.bn;

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] || key;
}
