"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  AlertTriangle,
  ListChecks,
  Lightbulb,
  Baby,
  Cat,
  Activity,
  Droplets,
  Pill,
  HeartHandshake,
  UsersIcon,
  ShieldCheck,
} from "lucide-react"
import { EquipmentList } from "@/entities/EquipmentList"
import { Badge } from "@/components/ui/badge"
import { createPageUrl } from "@/utils"
import { useNavigate } from "react-router-dom"
// Import locales for date-fns CORRECTLY
import { he } from "date-fns/locale" // Corrected import for Hebrew
import { enUS } from "date-fns/locale" // Corrected import for English (US)
// If you need Arabic and Russian locales for date-fns formatting:
// import { ar } from 'date-fns/locale';
// import { ru } from 'date-fns/locale';

const baseTranslations = {
  he: {
    pageTitle: "ניהול ציוד חירום",
    pageDescription: "צור, ערוך ונהל רשימות ציוד חיוני למצבי חירום.",
    createListAI: "צור רשימה עם AI",
    createListManual: "צור רשימה ידנית",
    myLists: "הרשימות שלי",
    noListsYet: "עדיין לא יצרת רשימות ציוד.",
    noListsYetDescription: "לחץ על 'צור רשימה ידנית' או 'צור רשימה עם AI' כדי להתחיל.",
    selectListPrompt: "בחר רשימה להצגה או צור אחת חדשה.",
    createNewListButtonPrompt: "צור רשימה חדשה",
    exportList: "ייצוא רשימה",
    editListDetails: "ערוך פרטי רשימה",
    itemQuantityUnit: "{quantity} {unit}",
    categoryLabel: "קטגוריה:",
    expiryLabel: "תפוגה:",
    addItemToList: "הוסף פריט לרשימה",
    reminders: "תזכורות",
    deleteItem: "מחק פריט",
    createListModalTitle: "יצירת רשימה חדשה",
    listNameLabel: "שם הרשימה",
    listDescriptionLabel: "תיאור (אופציונלי)",
    cancel: "ביטול",
    createList: "צור רשימה",
    aiModalTitle: "יצירת רשימת ציוד חכמה עם AI",
    aiPromptDescription: "ספר על עצמך ועל משק הבית שלך כדי שנוכל להתאים את רשימת הציוד המומלצת עבורך.",
    aiPromptPlaceholder:
      "לדוגמה: אני גר בדירה עם בעלי וילדה בת 5. יש לנו חתול. אני אדם עם מוגבלות בניידות ואני משתמש בהליכון. אנחנו גרים בקומה 2 ללא מעלית.",
    aiGenerateButton: "צור המלצות AI",
    aiGenerating: "יוצר רשימה מותאמת אישית...",
    aiItemsTitle: "פריטים מומלצים על ידי AI",
    aiListNamePlaceholder: "לדוגמה: רשימת חירום חכמה למשפחה",
    aiSaveList: "שמור רשימה מומלצת",
    aiSavedSuccess: "הרשימה נשמרה בהצלחה!",
    aiGoToList: "עבור לרשימה",
    aiBack: "חזור",
    aiFamilyComposition: "הרכב המשפחה",
    aiAdults: "מבוגרים",
    aiChildren: "ילדים",
    aiBabies: "תינוקות",
    aiPets: "חיות מחמד",
    aiSpecialNeeds: "צרכים מיוחדים",
    aiNeedsAttention: "צריך תשומת לב",
    aiCategories: {
      water_food: "מים ומזון",
      medical: "ציוד רפואי",
      hygiene: "היגיינה",
      lighting_energy: "תאורה ואנרגיה",
      communication: "תקשורת",
      documents_money: "מסמכים וכסף",
      children: "ילדים",
      pets: "חיות מחמד",
      elderly: "קשישים",
      special_needs: "צרכים מיוחדים",
      other: "ציוד כללי",
      essential: "הכרחי",
      very_important: "חשוב מאוד",
      important: "חשוב",
      recommended: "מומלץ",
      optional: "אופציונלי",
      recommended_quantity_per_person_label: "כמות מומלצת לאדם",
      usage_instructions_label: "הוראות שימוש",
      shelf_life_label: "חיי מדף",
      default_unit: "יחידות",
    },
    categories: ["מים ומזון", "רפואה והיגיינה", "תאורה ואנרגיה", "תקשורת", "מסמכים וכסף", "ביגוד ושונות"],
    summaryTitle: "סיכום הציוד שלך",
    categoriesCount: "קטגוריות",
    totalReadiness: "מוכנות כוללת",
    missingEssentialItems: "הכרחיים חסרים",
    itemsChecked: "פריטים שנבדקו",
    backToAI: "חזור ליצירת רשימה",
    missingEssentialItemsTitle: "פריטים הכרחיים חסרים",
    andMoreMissing: "ועוד {count} פריטים הכרחיים חסרים...",
    allItemsTitle: "כל הפריטים ברשימה",
    searchItemPlaceholder: "חפש פריט...",
    categoryFilterPlaceholder: "קטגוריה",
    allCategories: "כל הקטגוריות",
    importanceFilterPlaceholder: "חשיבות",
    allLevels: "כל הרמות",
    clearFiltersButton: "נקה",
    noItemsFound: "לא נמצאו פריטים התואמים את החיפוש",
    showAllItemsButton: "הצג את כל הפריטים",
    description: "תיאור",
    quantity: "כמות",
    important: "חשוב",
    durationHours: "משך זמן (שעות)",
    moreEssentialsMissing: "יש לרכוש {count} פריטים הכרחיים נוספים לשלמות הציוד",
    editList: "ערוך רשימה",
    cancelEditing: "בטל עריכה",
    addItem: "הוסף פריט",
    saveChanges: "שמור שינויים",
    addNewItem: "הוספת פריט חדש",
    itemName: "שם הפריט",
    itemCategory: "קטגוריה",
    itemQuantity: "כמות",
    itemUnit: "יחידת מידה",
    itemImportance: "חשיבות",
    itemDescription: "תיאור",
    itemShelfLife: "חיי מדף",
    itemUsageInstructions: "הוראות שימוש",
    itemRecommendedQuantity: "כמות מומלצת לאדם",
    cancel: "ביטול",
    add: "הוסף",
    undoAction: "בטל פעולה אחרונה",
    removeItem: "Remove Item",
    removeItemConfirm: "האם אתה בטוח שברצונך להסיר את הפריט?",
    removeItemDescription: "פעולה זו תסיר את הפריט מהרשימה ולא ניתן יהיה לשחזר אותו.",
    confirmRemove: "הסר",
    cancelRemove: "ביטול",
    enterListNamePrompt: "הזן שם לרשימה החדשה:",
    defaultNewListName: "רשימה חדשה",
    listNameCannotBeEmpty: "שם הרשימה אינו יכול להיות ריק.",
    notSpecified: "לא צוין",
    errorProvideListNameOrProfile: "אנא ספק שם לרשימה או פרטי פרופיל ליצירת רשימה מותאמת אישית.",
    equipmentListFor: "רשימת ציוד עבור",
    adults: "מבוגרים",
    listUpdatedSuccessfully: "הרשימה עודכנה בהצלחה!",
    listCreatedSuccessfully: "הרשימה נוצרה בהצלחה!",
    errorSavingList: "שגיאה בשמירת הרשימה. נסה שוב.",
    errorNoListToUpdate: "לא נבחרה רשימה לעדכון.",
    changesSavedSuccessfully: "השינויים נשמרו בהצלחה!",
    errorSavingChanges: "שגיאה בשמירת השינויים.",
    expiryDate: "תאריך תפוגה",
    setExpiryDate: "הגדר תאריך תפוגה",
    sendReminder: "שלח לי תזכורת",
    aiSuggestedExpiry: 'תוקף מוצע ע"י AI: ',
    noExpiryDate: "אין תאריך תפוגה",
    days: "ימים",
    unknownItem: "פריט לא ידוע",
    usageInstructionsPlaceholder: "הוראות שימוש והערות חשובות",
  },
  en: {
    pageTitle: "Emergency Equipment Management",
    pageDescription: "Create, edit, and manage essential equipment lists for emergencies.",
    createListAI: "Create List with AI",
    createListManual: "Create List Manually",
    myLists: "My Lists",
    noListsYet: "You haven't created any equipment lists yet.",
    noListsYetDescription: "Click 'Create List Manually' or 'Create List with AI' to get started.",
    selectListPrompt: "Select a list to display or create a new one.",
    createNewListButtonPrompt: "Create New List",
    exportList: "Export List",
    editListDetails: "Edit List Details",
    itemQuantityUnit: "{quantity} {unit}",
    categoryLabel: "Category:",
    expiryLabel: "Expires:",
    addItemToList: "Add Item to List",
    reminders: "Reminders",
    deleteItem: "Delete Item",
    createListModalTitle: "Create New List",
    listNameLabel: "List Name",
    listDescriptionLabel: "Description (optional)",
    cancel: "Cancel",
    aiModalTitle: "Smart AI Equipment List Creation",
    aiPromptDescription:
      "Tell us about yourself and your household so we can customize the recommended equipment list for you.",
    aiPromptPlaceholder:
      "For example: I live in an apartment with my husband and a 5-year-old daughter. We have a cat. I have a mobility disability and use a walker. We live on the 2nd floor without an elevator.",
    aiGenerateButton: "Generate AI Recommendations",
    aiGenerating: "Generating personalized list...",
    aiItemsTitle: "AI Recommended Items",
    aiListNamePlaceholder: "e.g., Smart Family Emergency List",
    aiSaveList: "Save Recommended List",
    aiSavedSuccess: "List saved successfully!",
    aiGoToList: "Go to List",
    aiBack: "Back",
    aiFamilyComposition: "Family Composition",
    aiAdults: "Adults",
    aiChildren: "Children",
    aiBabies: "Babies",
    aiPets: "Pets",
    aiSpecialNeeds: "Special Needs",
    aiNeedsAttention: "Needs Attention",
    aiCategories: {
      water_food: "Water & Food",
      medical: "Medical Equipment",
      hygiene: "Hygiene",
      lighting_energy: "Lighting & Energy",
      communication: "Communication",
      documents_money: "Documents & Money",
      children: "Children",
      pets: "Pets",
      elderly: "Elderly",
      special_needs: "Special Needs",
      other: "General Equipment",
      essential: "Essential",
      very_important: "Very Important",
      important: "Important",
      recommended: "Recommended",
      optional: "Optional",
      recommended_quantity_per_person_label: "Recommended Quantity per Person",
      usage_instructions_label: "Usage Instructions",
      shelf_life_label: "Shelf Life",
      default_unit: "Units",
    },
    categories: [
      "Food & Water",
      "Medical & Hygiene",
      "Lighting & Energy",
      "Communication",
      "Documents & Money",
      "Clothing & Miscellaneous",
    ],
    summaryTitle: "Your Equipment Summary",
    categoriesCount: "Categories",
    totalReadiness: "Total Readiness",
    missingEssentialItems: "Essential Missing",
    itemsChecked: "Items Checked",
    backToAI: "Back to AI Prompt",
    missingEssentialItemsTitle: "Missing Essential Items",
    andMoreMissing: "And {count} more essential items missing...",
    allItemsTitle: "All Items in List",
    searchItemPlaceholder: "Search item...",
    categoryFilterPlaceholder: "Category",
    allCategories: "All Categories",
    importanceFilterPlaceholder: "Importance",
    allLevels: "All Levels",
    clearFiltersButton: "Clear",
    noItemsFound: "No items found matching your search",
    showAllItemsButton: "Show All Items",
    description: "Description",
    quantity: "Quantity",
    important: "Important",
    durationHours: "Duration (hours)",
    moreEssentialsMissing: "You need to acquire {count} more essential items for complete preparedness",
    editList: "Edit List",
    cancelEditing: "Cancel Editing",
    addItem: "Add Item",
    saveChanges: "Save Changes",
    addNewItem: "Add New Item",
    itemName: "Item Name",
    itemCategory: "Category",
    itemQuantity: "Quantity",
    itemUnit: "Unit",
    itemImportance: "Importance",
    itemDescription: "Description",
    itemShelfLife: "Shelf Life",
    itemUsageInstructions: "Usage Instructions",
    itemRecommendedQuantity: "Recommended Quantity per Person",
    cancel: "Cancel",
    add: "Add",
    undoAction: "Undo Last Action",
    removeItem: "Remove Item",
    removeItemConfirm: "Are you sure you want to remove this item?",
    removeItemDescription: "This action will remove the item from the list and cannot be undone.",
    confirmRemove: "Remove",
    cancelRemove: "Cancel",
    enterListNamePrompt: "Enter a name for the new list:",
    defaultNewListName: "New List",
    listNameCannotBeEmpty: "List name cannot be empty.",
    notSpecified: "Not Specified",
    errorProvideListNameOrProfile: "Please provide a list name or profile details to create a personalized list.",
    equipmentListFor: "Equipment list for",
    adults: "adults",
    listUpdatedSuccessfully: "List updated successfully!",
    listCreatedSuccessfully: "List created successfully!",
    errorSavingList: "Error saving list. Please try again.",
    errorNoListToUpdate: "No list selected for updating.",
    changesSavedSuccessfully: "Changes saved successfully!",
    errorSavingChanges: "Error saving changes.",
    expiryDate: "Expiry Date",
    setExpiryDate: "Set Expiry Date",
    sendReminder: "Send me a reminder",
    aiSuggestedExpiry: "AI Suggested Expiry: ",
    noExpiryDate: "No expiry date",
    days: "days",
    unknownItem: "Unknown Item",
    usageInstructionsPlaceholder: "Usage instructions and important notes",
  },
  ar: {
    pageTitle: "إدارة معدات الطوارئ",
    pageDescription: "إنشاء وتحرير وإدارة قوائم المعدات الأساسية للطوارئ.",
    createListAI: "إنشاء قائمة بالذكاء الاصطناعي",
    createListManual: "إنشاء قائمة يدويًا",
    myLists: "قوائمي",
    noListsYet: "لم تقم بإنشاء أي قوائم معدات حتى الآن.",
    noListsYetDescription: "انقر فوق 'إنشاء قائمة يدويًا' أو 'إنشاء قائمة بالذكاء الاصطناعي' للبدء.",
    selectListPrompt: "حدد قائمة لعرضها أو إنشاء واحدة جديدة.",
    createNewListButtonPrompt: "إنشاء قائمة جديدة",
    exportList: "تصدير القائمة",
    editListDetails: "تحرير تفاصيل القائمة",
    itemQuantityUnit: "{quantity} {unit}",
    categoryLabel: "الفئة:",
    expiryLabel: "تنتهي صلاحيته:",
    addItemToList: "إضافة عنصر إلى القائمة",
    reminders: "التذكيرات",
    deleteItem: "حذف العنصر",
    createListModalTitle: "إنشاء قائمة جديدة",
    listNameLabel: "اسم القائمة",
    listDescriptionLabel: "الوصف (اختياري)",
    cancel: "إلغاء",
    aiModalTitle: "إنشاء قائمة معدات ذكية بالذكاء الاصطناعي",
    aiPromptDescription: "أخبرنا عن نفسك وعن أسرتك حتى نتمكن من تخصيص قائمة المعدات الموصى بها لك.",
    aiPromptPlaceholder:
      "مثال: أعيش في شقة مع زوجي وابنة تبلغ من العمر 5 سنوات. لدينا قطة. لدي إعاقة حركية وأستخدم مشاية. نعيش في الطابق الثاني بدون مصعد.",
    aiGenerateButton: "إنشاء توصيات الذكاء الاصطناعي",
    aiGenerating: "جاري إنشاء قائمة مخصصة...",
    aiItemsTitle: "العناصر الموصى بها بواسطة الذكاء الاصطناعي",
    aiListNamePlaceholder: "على سبيل المثال: قائمة الطوارئ العائلية الذكية",
    aiSaveList: "حفظ القائمة الموصى بها",
    aiSavedSuccess: "تم حفظ القائمة بنجاح!",
    aiGoToList: "اذهب إلى القائمة",
    aiBack: "رجوع",
    aiFamilyComposition: "تكوين الأسرة",
    aiAdults: "البالغون",
    aiChildren: "الأطفال",
    aiBabies: "الرضع",
    aiPets: "الحيوانات الأليفة",
    aiSpecialNeeds: "الاحتياجات الخاصة",
    aiNeedsAttention: "يحتاج إلى اهتمام",
    aiCategories: {
      water_food: "الماء والغذاء",
      medical: "المعدات الطبية",
      hygiene: "النظافة",
      lighting_energy: "الإضاءة والطاقة",
      communication: "الاتصالات",
      documents_money: "المستندات والمال",
      children: "الأطفال",
      pets: "الحيوانات الأليفة",
      elderly: "كبار السن",
      special_needs: "الاحتياجات الخاصة",
      other: "معدات عامة",
      essential: "ضروري",
      very_important: "مهم جدا",
      important: "مهم",
      recommended: "موصى به",
      optional: "اختياري",
      recommended_quantity_per_person_label: "الكمية الموصى بها للشخص",
      usage_instructions_label: "تعليمات الاستخدام",
      shelf_life_label: "مدة الصلاحية",
      default_unit: "وحدات",
    },
    categories: [
      "الطعام والماء",
      "الطبية والنظافة",
      "الإضاءة والطاقة",
      "الاتصالات",
      "المستندات والمال",
      "الملابس والمتفرقات",
    ],
    summaryTitle: "ملخص معداتك",
    categoriesCount: "فئات",
    totalReadiness: "الاستعداد الكلي",
    missingEssentialItems: "أساسيات مفقودة",
    itemsChecked: "العناصر التي تم فحصها",
    backToAI: "العودة إلى موجه الذكاء الاصطناعي",
    missingEssentialItemsTitle: "العناصر الأساسية المفقودة",
    andMoreMissing: "و {count} عناصر أساسية أخرى مفقودة ...",
    allItemsTitle: "جميع العناصر في القائمة",
    searchItemPlaceholder: "ابحث عن عنصر ...",
    categoryFilterPlaceholder: "الفئة",
    allCategories: "جميع الفئات",
    importanceFilterPlaceholder: "الأهمية",
    allLevels: "جميع المستويات",
    clearFiltersButton: "مسح",
    noItemsFound: "لم يتم العثور على العناصر تطابق بحثك",
    showAllItemsButton: "عرض جميع العناصر",
    description: "الوصف",
    quantity: "الكمية",
    important: "مهم",
    durationHours: "المدة (ساعات)",
    moreEssentialsMissing: "تحتاج إلى الحصول على {count} من العناصر الأساسية الإضافية للتأهب الكامل",
    editList: "تعديل القائمة",
    cancelEditing: "إلغاء التعديل",
    addItem: "أضف بندا",
    saveChanges: "حفظ التغييرات",
    addNewItem: "إضافة عنصر جديد",
    itemName: "اسم العنصر",
    itemCategory: "الفئة",
    itemQuantity: "الكمية",
    itemUnit: "الوحدة",
    itemImportance: "الأهمية",
    itemDescription: "الوصف",
    itemShelfLife: "مدة الصلاحية",
    itemUsageInstructions: "تعليمات الاستخدام",
    itemRecommendedQuantity: "الكمية الموصى بها للشخص",
    cancel: "إلغاء",
    add: "أضف",
    undoAction: "בטל פעולה אחרונה",
    removeItem: "Remove Item",
    removeItemConfirm: "Are you sure you want to remove this item?",
    removeItemDescription: "This action will remove the item from the list and cannot be undone.",
    confirmRemove: "Remove",
    cancelRemove: "Cancel",
    enterListNamePrompt: "أدخل اسما للقائمة الجديدة:",
    defaultNewListName: "قائمة جديدة",
    listNameCannotBeEmpty: "اسم الرשימה لا يمكن أن يكون فارغًا.",
    notSpecified: "غير محدد",
    errorProvideListNameOrProfile: "يرجى تقديم اسم قائمة أو تفاصيل الملف الشخصي لإنشاء قائمة مخصصة.",
    equipmentListFor: "قائمة المعدات ل",
    adults: "بالغين",
    listUpdatedSuccessfully: "تم تحديث القائمة بنجاح!",
    listCreatedSuccessfully: "تم إنشاء القائمة بنجاح!",
    errorSavingList: "خطأ في حفظ القائمة. حاول مرة أخرى.",
    errorNoListToUpdate: "لم يتم تحديد أي قائمة للتحديث.",
    changesSavedSuccessfully: "تم حفظ التغييرات بنجاح!",
    errorSavingChanges: "خطأ في حفظ التغييرات.",
    expiryDate: "تاريخ انتهاء الصلاحية",
    setExpiryDate: "تحديد تاريخ انتهاء الصلاحية",
    sendReminder: "أرسل لي تذكيرًا",
    aiSuggestedExpiry: "انتهاء الصلاحية المقترح بواسطة الذكاء الاصطناعي: ",
    noExpiryDate: "لا يوجد تاريخ انتهاء صلاحية",
    days: "أيام",
    unknownItem: "عنصر غير معروف",
    usageInstructionsPlaceholder: "تعليمات الاستخدام والملاحظات الهامة",
  },
  ru: {
    pageTitle: "Управление аварийным оборудованием",
    pageDescription: "Создавайте, редактируйте и управляйте списками важного оборудования для чрезвычайных ситуаций.",
    createListAI: "Создать список с ИИ",
    createListManual: "Создать список вручную",
    myLists: "Мои списки",
    noListsYet: "Вы еще не создали списки оборудования.",
    noListsYetDescription: "Нажмите «Создать список вручную» или «Создать список с ИИ», чтобы начать.",
    selectListPrompt: "Выберите список для просмотра или создайте новый.",
    createNewListButtonPrompt: "Создать новый список",
    exportList: "Экспорт списка",
    editListDetails: "Редактировать детали списка",
    itemQuantityUnit: "{quantity} {unit}",
    categoryLabel: "Категория:",
    expiryLabel: "Истекает:",
    addItemToList: "Добавить предмет в список",
    reminders: "Напоминания",
    deleteItem: "Удалить предмет",
    createListModalTitle: "Создать новый список",
    listNameLabel: "Название списка",
    listDescriptionLabel: "Описание (необязательно)",
    cancel: "Отмена",
    aiModalTitle: "Создание списка оборудования с помощью ИИ",
    aiPromptDescription:
      "Расскажите нам о себе и своей семье, чтобы мы могли настроить для вас рекомендуемый список оборудования.",
    aiPromptPlaceholder:
      "Например: Я живу в квартире с мужем и 5-летней дочерью. У нас есть кошка. У меня есть нарушения опорно-двигательного аппарата, и я пользуюсь ходунками. Мы живем на 2-м этаже без лифта.",
    aiGenerateButton: "Создать рекомендации ИИ",
    aiGenerating: "Создание персонализированного списка...",
    aiItemsTitle: "Рекомендуемые ИИ предметы",
    aiListNamePlaceholder: "например, Умный семейный аварийный список",
    aiSaveList: "Сохранить рекомендуемый список",
    aiSavedSuccess: "Список успешно сохранен!",
    aiGoToList: "Перейти к списку",
    aiBack: "Назад",
    aiFamilyComposition: "Состав семьи",
    aiAdults: "Взрослые",
    aiChildren: "Дети",
    aiBabies: "Младенцы",
    aiPets: "Домашние животные",
    aiSpecialNeeds: "Особые потребности",
    aiNeedsAttention: "Требует внимания",
    aiCategories: {
      water_food: "Вода и еда",
      medical: "Медицинское оборудование",
      hygiene: "Гигиена",
      lighting_energy: "Освещение и энергия",
      communication: "Связь",
      documents_money: "Документы и деньги",
      children: "Дети",
      pets: "Домашние животные",
      elderly: "Пожилые",
      special_needs: "Особые потребности",
      other: "Общее оборудование",
      essential: "Необходимо",
      very_important: "Очень важно",
      important: "Важно",
      recommended: "Рекомендуется",
      optional: "Необязательно",
      recommended_quantity_per_person_label: "Рекомендуемое количество на человека",
      usage_instructions_label: "Инструкции по использованию",
      shelf_life_label: "Срок годности",
      default_unit: "Единицы",
    },
    categories: [
      "Еда и вода",
      "Медицинские принадлежности и гигиена",
      "Освещение и энергия",
      "Связь",
      "Документы и деньги",
      "Одежда и разное",
    ],
    summaryTitle: "Сводка вашего оборудования",
    categoriesCount: "Категории",
    totalReadiness: "Общая готовность",
    missingEssentialItems: "Отсутствующие необходимые",
    itemsChecked: "Проверенные элементы",
    backToAI: "Вернуться к ИИ-запросу",
    missingEssentialItemsTitle: "Отсутствующие необходимые предметы",
    andMoreMissing: "И еще {count} отсутствующих необходимых предметов...",
    allItemsTitle: "Все элементы в списке",
    searchItemPlaceholder: "Поиск элемента...",
    categoryFilterPlaceholder: "Категория",
    allCategories: "Все категории",
    importanceFilterPlaceholder: "Важность",
    allLevels: "Все уровни",
    clearFiltersButton: "Очистить",
    noItemsFound: "Элементы, соответствующие вашему поиску, не найдены",
    showAllItemsButton: "Показать все элементы",
    description: "Описание",
    quantity: "Количество",
    important: "Важно",
    durationHours: "Продолжительность (часы)",
    moreEssentialsMissing: "Вам необходимо приобрести еще {count} предметов первой необходимости для полной готовности",
    editList: "Редактировать список",
    cancelEditing: "Отменить редактирование",
    addItem: "Добавить элемент",
    saveChanges: "Сохранить изменения",
    addNewItem: "Добавление нового элемента",
    itemName: "Название элемента",
    itemCategory: "Категория",
    itemQuantity: "Количество",
    itemUnit: "Единица измерения",
    itemDescription: "Описание",
    itemShelfLife: "Срок годности",
    itemUsageInstructions: "Инструкции по использованию",
    itemRecommendedQuantity: "Рекомендуемое количество на человека",
    cancel: "Отмена",
    add: "Добавить",
    undoAction: "Undo Last Action",
    removeItem: "Remove Item",
    removeItemConfirm: "Are you sure you want to remove this item?",
    removeItemDescription: "This action will remove the item from the list and cannot be undone.",
    confirmRemove: "Remove",
    cancelRemove: "Cancel",
    enterListNamePrompt: "Введите имя для нового списка:",
    defaultNewListName: "Новый список",
    listNameCannotBeEmpty: "Имя списка не может быть пустым.",
    notSpecified: "Не указано",
    errorProvideListNameOrProfile:
      "Пожалуйста, предоставьте имя списка или сведения профиля для создания персонализированного списка.",
    equipmentListFor: "Список оборудования для",
    adults: "взрослых",
    listUpdatedSuccessfully: "Список успешно обновлен!",
    listCreatedSuccessfully: "Список успешно создан!",
    errorSavingList: "Ошибка сохранения списка. Пожалуйста, попробуйте еще раз.",
    errorNoListToUpdate: "Список не выбран для обновления.",
    changesSavedSuccessfully: "Изменения успешно сохранены!",
    errorSavingChanges: "Ошибка сохранения изменений.",
    expiryDate: "Срок годности",
    setExpiryDate: "Установить срок годности",
    sendReminder: "Отправить мне напоминание",
    aiSuggestedExpiry: "Предлагаемый ИИ срок годности: ",
    noExpiryDate: "Нет срока годности",
    days: "дни",
    unknownItem: "Неизвестный элемент",
    usageInstructionsPlaceholder: "Инструкции по использованию и важные примечания",
  },
}

const categoryIcons = {
  water_food: <Droplets className="h-5 w-5" />,
  medical: <Pill className="h-5 w-5" />,
  hygiene: <HeartHandshake className="h-5 w-5" />,
  lighting_energy: <Lightbulb className="h-5 w-5" />,
  communication: <FileText className="h-5 w-5" />,
  documents_money: <FileText className="h-5 w-5" />,
  children: <Baby className="h-5 w-5" />,
  pets: <Cat className="h-5 w-5" />,
  elderly: <UsersIcon className="h-5 w-5" />,
  special_needs: <Activity className="h-5 w-5" />,
  other: <ListChecks className="h-5 w-5" />,
  emergency: <ShieldCheck className="h-5 w-5" />,
  food: <Droplets className="h-5 w-5" />,
  pet: <Cat className="h-5 w-5" />,
}

const headerStyles = `
  @media (min-width: 480px) and (max-width: 639px) {
    .xs\\:flex-row {
      flex-direction: row;
    }
    .xs\\:w-auto {
      width: auto;
    }
    .xs\\:items-center {
      align-items: center;
    }
    .xs\\:gap-2 {
      gap: 0.5rem;
    }
    .xs\\:inline {
      display: inline;
    }
  }
  /* אין צורך יותר להסתיר את .accordion-chevron אם נסיר את החץ הידני */
`

export default function EquipmentPage() {
  const navigate = useNavigate()
  document.title = "תיקון עדכון רשימות - גישה מקיפה יותר"
  const language = document.documentElement.lang || "he"
  const [translations, setTranslations] = useState(baseTranslations[language] || baseTranslations.he)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [aiUserPrompt, setAIUserPrompt] = useState("")
  const [isAILoading, setIsAILoading] = useState(isAILoading)
  const [aiGeneratedItems, setAIGeneratedItems] = useState([])
  const [aiGeneratedProfile, setAIGeneratedProfile] = useState(null)
  const [openAccordionItem, setOpenAccordionItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedImportance, setSelectedImportance] = useState("all")
  const [filteredItems, setFilteredItems] = useState([])
  const [isEditing, setIsEditing] = useState(false) // Fix: Initialize to false
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)

  const t = translations // Use translations directly as it's updated by useEffect

  const [newItem, setNewItem] = useState({
    name: "",
    category: "water_food",
    quantity: 1,
    unit: t.aiCategories?.default_unit || "יחידות",
    importance: 3,
    description: "",
    expiryDate: null,
    sendExpiryReminder: false,
    usage_instructions: "",
    recommended_quantity_per_person: "",
    shelf_life: "", // הוספת שדה אורך חיים
    sms_notification: false,
  })
  const [itemHistory, setItemHistory] = useState([])
  const [itemToRemove, setItemToRemove] = useState(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [currentListName, setCurrentListName] = useState("")
  const [isListContextLoading, setIsListContextLoading] = useState(false)
  const [lastSavedMessage, setLastSavedMessage] = useState("")

  const isRTL = language === "he" || language === "ar"

  const currentLocale = language === "he" ? he : enUS

  const categoryColors = {
    water_food: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      darkBg: "dark:bg-blue-900/30",
      darkText: "dark:text-blue-400",
      icon: <Droplets className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    medical: {
      bg: "bg-red-100",
      text: "text-red-800",
      darkBg: "dark:bg-red-900/30",
      darkText: "dark:text-red-400",
      icon: <Pill className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    hygiene: {
      bg: "bg-green-100",
      text: "text-green-800",
      darkBg: "dark:bg-green-900/30",
      darkText: "dark:text-green-400",
      icon: <HeartHandshake className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    lighting_energy: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      darkBg: "dark:bg-yellow-900/30",
      darkText: "dark:text-yellow-400",
      icon: <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    communication: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      darkBg: "dark:bg-purple-900/30",
      darkText: "dark:text-purple-400",
      icon: <FileText className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    documents_money: {
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      darkBg: "dark:bg-indigo-900/30",
      darkText: "dark:text-indigo-400",
      icon: <FileText className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    children: {
      bg: "bg-pink-100",
      text: "text-pink-800",
      darkBg: "dark:bg-pink-900/30",
      darkText: "dark:text-pink-400",
      icon: <Baby className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    pets: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      darkBg: "dark:bg-amber-900/30",
      darkText: "dark:text-amber-400",
      icon: <Cat className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    elderly: {
      bg: "bg-teal-100",
      text: "text-teal-800",
      darkBg: "dark:bg-teal-900/30",
      darkText: "dark:text-teal-400",
      icon: <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    special_needs: {
      bg: "bg-cyan-100",
      text: "text-cyan-800",
      darkBg: "dark:bg-cyan-900/30",
      darkText: "dark:text-cyan-400",
      icon: <Activity className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    other: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      darkBg: "dark:bg-gray-700",
      darkText: "dark:text-gray-400",
      icon: <ListChecks className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    emergency: {
      bg: "bg-red-100",
      text: "text-red-800",
      darkBg: "dark:bg-red-900/30",
      darkText: "dark:text-red-400",
      icon: <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    food: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      darkBg: "dark:bg-blue-900/30",
      darkText: "dark:text-blue-400",
      icon: <Droplets className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    pet: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      darkBg: "dark:bg-amber-900/30",
      darkText: "dark:text-amber-400",
      icon: <Cat className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
  }

  const getCategoryStyle = (categoryKey) => {
    if (typeof categoryKey === "string" && categoryKey.includes(",")) {
      return categoryColors.other
    }

    // Map alternative category names to our standard ones
    const categoryMapping = {
      food: "water_food",
      pet: "pets",
    }

    const mappedCategory = categoryMapping[categoryKey] || categoryKey

    // Make sure we return the complete object with icon
    const style = categoryColors[mappedCategory] || categoryColors.other

    return style
  }

  const getImportanceBadge = (importance, forCard = false) => {
    const baseClasses = "text-xs flex-shrink-0 break-words"
    const cardClasses = forCard ? "px-2 py-1" : ""

    if (importance >= 5) {
      return (
        <Badge
          variant="outline"
          className={`${baseClasses} ${cardClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800`}
        >
          <AlertTriangle className="h-3 w-3 mr-1 hidden xs:inline" />
          {t.aiCategories.essential || "הכרחי"}
        </Badge>
      )
    } else if (importance >= 4) {
      return (
        <Badge
          variant="outline"
          className={`${baseClasses} ${cardClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800`}
        >
          <AlertTriangle className="h-3 w-3 mr-1 hidden xs:inline" />
          {t.aiCategories.very_important || "חשוב מאוד"}
        </Badge>
      )
    } else if (importance >= 3) {
      return (
        <Badge
          variant="outline"
          className={`${baseClasses} ${cardClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800`}
        >
          {t.aiCategories.important || "חשוב"}
        </Badge>
      )
    } else if (importance >= 2) {
      return (
        <Badge
          variant="outline"
          className={`${baseClasses} ${cardClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800`}
        >
          {t.aiCategories.recommended || "מומלץ"}
        </Badge>
      )
    }
    return (
      <Badge
        variant="outline"
        className={`${baseClasses} ${cardClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700`}
      >
        {t.aiCategories.optional || "אופציונלי"}
      </Badge>
    )
  }

  const handleSaveListAndGenerateItems = async () => {
    setIsAILoading(true)
    setError("")
    setLastSavedMessage("")

    if (!currentListName && !(aiGeneratedProfile && Object.keys(aiGeneratedProfile).length > 0)) {
      setError(t.errorProvideListNameOrProfile || "אנא ספק שם לרשימה או פרטי פרופיל ליצירת רשימה מותאמת אישית.")
      setIsAILoading(false)
      return
    }

    let listNameToSave = currentListName
    if (!listNameToSave && aiGeneratedProfile) {
      listNameToSave = `${t.equipmentListFor || "רשימת ציוד עבור"} ${aiGeneratedProfile.adults || 0} ${t.adults || "מבוגרים"}`
    }

    if (!listNameToSave) {
      listNameToSave = t.defaultNewListName || "רשימה חדשה"
    }

    try {
      const listToSave = {
        name: listNameToSave,
        items: aiGeneratedItems.map((item) => ({
          name: item.name,
          category: item.category,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || t.aiCategories?.default_unit || "יחידות",
          obtained: typeof item.obtained === "boolean" ? item.obtained : false,
          expiryDate: item.expiryDate || null, // This is the user-set or AI-suggested-then-user-confirmed date
          // aiSuggestedExpiryDate is primarily for initial population, not explicitly saved if user sets expiryDate
          sendExpiryReminder: typeof item.sendExpiryReminder === "boolean" ? item.sendExpiryReminder : false,
          description: item.description || "",
          importance: item.importance || 3,
          shelf_life: item.shelf_life || null,
          usage_instructions: item.usage_instructions || "",
          sms_notification: typeof item.sms_notification === "boolean" ? item.sms_notification : false,
        })),
        profile: aiGeneratedProfile,
      }

      let savedListResponse
      const urlParams = new URLSearchParams(window.location.search)
      const existingListId = urlParams.get("listId")

      if (existingListId) {
        savedListResponse = await EquipmentList.update(existingListId, listToSave)
        setLastSavedMessage(t.listUpdatedSuccessfully || "הרשימה עודכנה בהצלחה!")
      } else {
        // When creating a new list, items may have aiSuggestedExpiryDate.
        // We want to initialize expiryDate with aiSuggestedExpiryDate if available.
        listToSave.items = listToSave.items.map((it) => ({
          ...it,
          expiryDate: it.expiryDate || it.aiSuggestedExpiryDate || null,
        }))
        savedListResponse = await EquipmentList.create(listToSave)
        setLastSavedMessage(t.listCreatedSuccessfully || "הרשימה נוצרה בהצלחה!")
      }

      navigate(createPageUrl("AllEquipmentListsPage") + "?refresh=" + new Date().getTime())
    } catch (error) {
      console.error("Error saving list:", error)
      setError(t.errorSavingList || "שגיאה בשמירת הרשימה.")
    } finally {
      setIsAILoading(false)
    }
  }

  useEffect(() => {
    const loadPageContext = async () => {
      setIsLoading(true)
      // ... קוד קיים לטעינת תרגומים ...

      setIsListContextLoading(true)
      const urlParams = new URLSearchParams(window.location.search)
      const listId = urlParams.get("listId")

      if (listId) {
        try {
          const listData = await EquipmentList.get(listId)
          if (listData) {
            setCurrentListName(listData.name)

            // המרת הפריטים למבנה שהממשק מצפה לו
            const itemsWithDetails = (listData.items || []).map((item) => ({
              ...item,
              id: item.id || Math.random().toString(36).substr(2, 9),
              obtained: typeof item.obtained === "boolean" ? item.obtained : false,
              importance: item.importance || 3,
              description: item.description || "",
              shelf_life: item.shelf_life || "",
              usage_instructions: item.usage_instructions || "",
              recommended_quantity_per_person: item.recommended_quantity_per_person || "",
              expiryDate: item.expiryDate || null,
              sendExpiryReminder: typeof item.sendExpiryReminder === "boolean" ? item.sendExpiryReminder : false,
              sms_notification: typeof item.sms_notification === "boolean" ? item.sms_notification : false,
              personalized_note: item.personalized_note || "",
              is_mandatory: item.is_mandatory || false,
            }))

            setAIGeneratedItems(itemsWithDetails)
            setFilteredItems(itemsWithDetails)

            // ניסיון לפענח את פרטי הפרופיל מה-JSON
            try {
              const profileData = listData.description ? JSON.parse(listData.description) : null
              setAIGeneratedProfile({
                adults: profileData?.adults || 1,
                children: profileData?.children || 0,
                babies: profileData?.babies || 0,
                elderly: profileData?.elderly || 0,
                pets: profileData?.pets || 0,
                special_needs: profileData?.special_needs || translations.notSpecified || "לא צוין",
                duration_hours: profileData?.duration_hours || 72,
                loadedFromExisting: true,
              })
            } catch (e) {
              console.warn("Could not parse profile data:", e)
              setAIGeneratedProfile({
                adults: 1,
                children: 0,
                babies: 0,
                elderly: 0,
                pets: 0,
                special_needs: translations.notSpecified || "לא צוין",
                duration_hours: 72,
                loadedFromExisting: true,
              })
            }
          } else {
            console.warn(`List with ID ${listId} not found.`)
            setCurrentListName("")
            setAIGeneratedProfile(null)
          }
        } catch (error) {
          console.error("Error loading equipment list:", error)
          setCurrentListName("")
          setAIGeneratedProfile(null)
        }
      } else {
        setCurrentListName("")
        setAIGeneratedItems([])
        setFilteredItems([])
        setAIGeneratedProfile(null)
      }
      setIsListContextLoading(false)
    }

    loadPageContext()
  }, [language])

  useEffect(() => {
    if (aiGeneratedItems.length > 0) {
      let filtered = [...aiGeneratedItems]

      if (searchQuery) {
        filtered = filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())),
        )
      }

      if (selectedCategory && selectedCategory !== "all") {
        filtered = filtered.filter((item) => item.category === selectedCategory)
      }

      if (selectedImportance && selectedImportance !== "all") {
        const importanceMap = {
          הכרחי: 5,
          "חשוב מאוד": 4,
          חשוב: 3,
          מומלץ: 2,
          אופציונלי: 1,
        }
        const importanceValue = importanceMap[selectedImportance]
        if (importanceValue !== undefined) {
          filtered = filtered.filter((item) => item.importance === importanceValue)
        }
      }

      setFilteredItems(filtered)
    } else {
      setFilteredItems([])
    }
  }, [searchQuery, selectedCategory, selectedImportance, aiGeneratedItems])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedImportance("all")
  }

  const aiCategories = t.aiCategories || {}
  const getCategoryDisplayName = (categoryKey) => aiCategories[categoryKey] || categoryKey

  const getMissingEssentialItems = () => {
    return aiGeneratedItems.filter((item) => item.importance >= 5 && !item.obtained)
  }

  const getObtainedItemsCount = () => {
    return aiGeneratedItems.filter((item) => item.obtained).length
  }

  const getTotalReadinessPercentage = () => {
    if (aiGeneratedItems.length === 0) return 0
    const obtainedCount = getObtainedItemsCount()
    return Math.round((obtainedCount / aiGeneratedItems.length) * 100)
  }

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      return
    }

    // Save current state to history for undo
    setItemHistory([...itemHistory, [...aiGeneratedItems]])

    const itemToAdd = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9),
    }

    setAIGeneratedItems([...aiGeneratedItems, itemToAdd])
    setNewItem({
      name: "",
      category: "water_food",
      quantity: 1,
      unit: t.aiCategories?.default_unit || "יחידות",
      importance: 3,
      description: "",
      expiryDate: null,
      sendExpiryReminder: false,
      usage_instructions: "",
      recommended_quantity_per_person: "",
      shelf_life: "",
      sms_notification: false,
    })
    setIsAddItemDialogOpen(false)
  }

  const handleRemoveItem = (itemId) => {
    setItemToRemove(itemId)
    setIsConfirmDialogOpen(true)
  }

  const confirmRemoveItem = () => {
    // Save current state to history for undo
    setItemHistory([...itemHistory, [...aiGeneratedItems]])

    const updatedItems = aiGeneratedItems.filter((item) => item.id !== itemToRemove)
    setAIGeneratedItems(updatedItems)
    setIsConfirmDialogOpen(false)
    setItemToRemove(null)
  }

  const handleUndoLastAction = () => {
    if (itemHistory.length > 0) {
      const lastState = itemHistory[itemHistory.length - 1]
      setAIGeneratedItems(lastState)
      setItemHistory(itemHistory.slice(0, -1))
    }
  }

  const handleToggleObtained = (itemId) => {
    // Save current state to history for undo
    setItemHistory([...itemHistory, [...aiGeneratedItems]])

    const updatedItems = aiGeneratedItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, obtained: !item.obtained }
      }
      return item
    })
    setAIGeneratedItems(updatedItems)
  }

  const handleUpdateItem = (itemId, updatedFields) => {
    // Save current state to history for undo
    setItemHistory([...itemHistory, [...aiGeneratedItems]])

    const updatedItems = aiGeneratedItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, ...updatedFields }
      }
      return item
    })
    setAIGeneratedItems(updatedItems)
  }

  const handleSaveChanges = async () => {
    setIsAILoading(true)
    setError("")
    setLastSavedMessage("")

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const listId = urlParams.get("listId")

      if (!listId) {
        setError(t.errorNoListToUpdate || "לא נבחרה רשימה לעדכון.")
        setIsAILoading(false)
        return
      }

      const listToUpdate = {
        name: currentListName,
        items: aiGeneratedItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || t.aiCategories?.default_unit || "יחידות",
          obtained: typeof item.obtained === "boolean" ? item.obtained : false,
          expiryDate: item.expiryDate || null,
          sendExpiryReminder: typeof item.sendExpiryReminder === "boolean" ? item.sendExpiryReminder : false,
          description: item.description || "",
          importance: item.importance || 3,
          shelf_life: item.shelf_life || null,
          usage_instructions: item.usage_instructions || "",
          recommended_quantity_per_person: item.recommended_quantity_per_person || "",
          sms_notification: typeof item.sms_notification === "boolean" ? item.sms_notification : false,
          personalized_note: item.personalized_note || "",
          is_mandatory: item.is_mandatory || false,
        })),
        profile: aiGeneratedProfile,
      }

      await EquipmentList.update(listId, listToUpdate)
      setLastSavedMessage(t.changesSavedSuccessfully || "השינויים נשמרו בהצלחה!")
      setIsEditing(false) // יציאה ממצב עריכה אחרי שמירה מוצלחת

      // הצגת ההודעה למשך 3 שניות ואז הסתרה
      setTimeout(() => {
        setLastSavedMessage("")
      }, 3000)
    } catch (error) {
      console.error("Error saving changes:", error)
      setError(t.errorSavingChanges || "שגיאה בשמירת השינויים.")

      // הסתרת הודעת השגיאה אחרי 5 שניות
      setTimeout(() => {
        setError("")
      }, 5000)
    } finally {
      setIsAILoading(false)
    }
  }

  // Render the equipment page UI
  return (
    <div className="container mx-auto px-4 py-8">
      <style>{headerStyles}</style>

      <h1 className="text-3xl font-bold mb-4">{t.pageTitle}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{t.pageDescription}</p>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {lastSavedMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {lastSavedMessage}
        </div>
      )}

      {isListContextLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start mb-6">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-semibold mb-2">{currentListName || t.selectListPrompt}</h2>
              {aiGeneratedProfile && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t.aiFamilyComposition}: {aiGeneratedProfile.adults} {t.aiAdults},
                  {aiGeneratedProfile.children > 0 && ` ${aiGeneratedProfile.children} ${t.aiChildren},`}
                  {aiGeneratedProfile.babies > 0 && ` ${aiGeneratedProfile.babies} ${t.aiBabies},`}
                  {aiGeneratedProfile.pets > 0 && ` ${aiGeneratedProfile.pets} ${t.aiPets}`}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsAddItemDialogOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {t.addItem}
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={isAILoading}
                  >
                    {isAILoading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2">⟳</span> {t.saveChanges}
                      </span>
                    ) : (
                      t.saveChanges
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    {t.cancelEditing}
                  </button>
                  {itemHistory.length > 0 && (
                    <button
                      onClick={handleUndoLastAction}
                      className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
                    >
                      {t.undoAction}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {t.editList}
                  </button>
                  <button
                    onClick={handleSaveListAndGenerateItems}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={isAILoading}
                  >
                    {isAILoading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2">⟳</span> {t.saveChanges}
                      </span>
                    ) : (
                      t.saveChanges
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {aiGeneratedItems.length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.categoriesCount}</h3>
                  <p className="text-2xl font-bold">{new Set(aiGeneratedItems.map((item) => item.category)).size}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.totalReadiness}</h3>
                  <p className="text-2xl font-bold">{getTotalReadinessPercentage()}%</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.missingEssentialItems}</h3>
                  <p className="text-2xl font-bold">{getMissingEssentialItems().length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.itemsChecked}</h3>
                  <p className="text-2xl font-bold">
                    {getObtainedItemsCount()} / {aiGeneratedItems.length}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h2 className="text-xl font-semibold mb-2 sm:mb-0">{t.allItemsTitle}</h2>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchItemPlaceholder}
                      className="px-3 py-2 border rounded"
                    />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border rounded"
                    >
                      <option value="all">{t.allCategories}</option>
                      {Object.keys(aiCategories)
                        .filter(
                          (key) =>
                            !key.includes("_label") &&
                            !key.includes("essential") &&
                            !key.includes("important") &&
                            !key.includes("recommended") &&
                            !key.includes("optional") &&
                            !key.includes("default_unit"),
                        )
                        .map((category) => (
                          <option key={category} value={category}>
                            {aiCategories[category]}
                          </option>
                        ))}
                    </select>
                    <select
                      value={selectedImportance}
                      onChange={(e) => setSelectedImportance(e.target.value)}
                      className="px-3 py-2 border rounded"
                    >
                      <option value="all">{t.allLevels}</option>
                      <option value="הכרחי">{t.aiCategories.essential}</option>
                      <option value="חשוב מאוד">{t.aiCategories.very_important}</option>
                      <option value="חשוב">{t.aiCategories.important}</option>
                      <option value="מומלץ">{t.aiCategories.recommended}</option>
                      <option value="אופציונלי">{t.aiCategories.optional}</option>
                    </select>
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      {t.clearFiltersButton}
                    </button>
                  </div>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{t.noItemsFound}</p>
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {t.showAllItemsButton}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 ${
                          item.obtained
                            ? "border-green-500"
                            : item.importance >= 5
                              ? "border-red-500"
                              : item.importance >= 4
                                ? "border-orange-500"
                                : item.importance >= 3
                                  ? "border-yellow-500"
                                  : item.importance >= 2
                                    ? "border-blue-500"
                                    : "border-gray-500"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{item.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {getImportanceBadge(item.importance, true)}
                              <Badge
                                variant="outline"
                                className={`text-xs px-2 py-1 ${getCategoryStyle(item.category).bg} ${
                                  getCategoryStyle(item.category).text
                                } ${getCategoryStyle(item.category).darkBg} ${getCategoryStyle(item.category).darkText}`}
                              >
                                {getCategoryStyle(item.category).icon}
                                <span className="ml-1">{getCategoryDisplayName(item.category)}</span>
                              </Badge>
                            </div>
                          </div>
                          {isEditing ? (
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                              aria-label={t.deleteItem}
                            >
                              &times;
                            </button>
                          ) : (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={item.obtained}
                                onChange={() => handleToggleObtained(item.id)}
                                disabled={!isEditing}
                                className="h-5 w-5 text-blue-600"
                              />
                            </div>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className="font-medium">{t.quantity}:</span> {item.quantity} {item.unit}
                        </div>

                        {item.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-medium">{t.description}:</span> {item.description}
                          </div>
                        )}

                        {item.shelf_life && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-medium">{t.aiCategories.shelf_life_label}:</span> {item.shelf_life}
                          </div>
                        )}

                        {item.usage_instructions && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-medium">{t.aiCategories.usage_instructions_label}:</span>{" "}
                            {item.usage_instructions}
                          </div>
                        )}

                        {item.expiryDate && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-medium">{t.expiryLabel}</span> {item.expiryDate}
                          </div>
                        )}

                        {isEditing && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.id, { quantity: e.target.value })}
                                min="1"
                                className="px-2 py-1 border rounded text-sm"
                                placeholder={t.quantity}
                              />
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value })}
                                className="px-2 py-1 border rounded text-sm"
                                placeholder={t.itemUnit}
                              />
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                                className="px-2 py-1 border rounded text-sm col-span-2"
                              >
                                {Object.keys(aiCategories)
                                  .filter(
                                    (key) =>
                                      !key.includes("_label") &&
                                      !key.includes("essential") &&
                                      !key.includes("important") &&
                                      !key.includes("recommended") &&
                                      !key.includes("optional") &&
                                      !key.includes("default_unit"),
                                  )
                                  .map((category) => (
                                    <option key={category} value={category}>
                                      {aiCategories[category]}
                                    </option>
                                  ))}
                              </select>
                              <select
                                value={item.importance}
                                onChange={(e) => handleUpdateItem(item.id, { importance: Number(e.target.value) })}
                                className="px-2 py-1 border rounded text-sm col-span-2"
                              >
                                <option value="5">{t.aiCategories.essential}</option>
                                <option value="4">{t.aiCategories.very_important}</option>
                                <option value="3">{t.aiCategories.important}</option>
                                <option value="2">{t.aiCategories.recommended}</option>
                                <option value="1">{t.aiCategories.optional}</option>
                              </select>
                              <input
                                type="text"
                                value={item.shelf_life || ""}
                                onChange={(e) => handleUpdateItem(item.id, { shelf_life: e.target.value })}
                                className="px-2 py-1 border rounded text-sm col-span-2"
                                placeholder={t.itemShelfLife}
                              />
                              <input
                                type="text"
                                value={item.usage_instructions || ""}
                                onChange={(e) => handleUpdateItem(item.id, { usage_instructions: e.target.value })}
                                className="px-2 py-1 border rounded text-sm col-span-2"
                                placeholder={t.itemUsageInstructions}
                              />
                              <input
                                type="text"
                                value={item.expiryDate || ""}
                                onChange={(e) => handleUpdateItem(item.id, { expiryDate: e.target.value })}
                                className="px-2 py-1 border rounded text-sm col-span-2"
                                placeholder={t.expiryDate}
                              />
                              <div className="col-span-2 flex items-center">
                                <input
                                  type="checkbox"
                                  checked={item.sendExpiryReminder}
                                  onChange={(e) => handleUpdateItem(item.id, { sendExpiryReminder: e.target.checked })}
                                  className="mr-2"
                                />
                                <label className="text-sm">{t.sendReminder}</label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {isAddItemDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">{t.addNewItem}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.itemName}</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.itemCategory}</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  {Object.keys(aiCategories)
                    .filter(
                      (key) =>
                        !key.includes("_label") &&
                        !key.includes("essential") &&
                        !key.includes("important") &&
                        !key.includes("recommended") &&
                        !key.includes("optional") &&
                        !key.includes("default_unit"),
                    )
                    .map((category) => (
                      <option key={category} value={category}>
                        {aiCategories[category]}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.itemQuantity}</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    min="1"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.itemUnit}</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.itemImportance}</label>
                <select
                  value={newItem.importance}
                  onChange={(e) => setNewItem({ ...newItem, importance: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="5">{t.aiCategories.essential}</option>
                  <option value="4">{t.aiCategories.very_important}</option>
                  <option value="3">{t.aiCategories.important}</option>
                  <option value="2">{t.aiCategories.recommended}</option>
                  <option value="1">{t.aiCategories.optional}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.itemDescription}</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows="2"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.itemShelfLife}</label>
                <input
                  type="text"
                  value={newItem.shelf_life}
                  onChange={(e) => setNewItem({ ...newItem, shelf_life: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.itemUsageInstructions}</label>
                <textarea
                  value={newItem.usage_instructions}
                  onChange={(e) => setNewItem({ ...newItem, usage_instructions: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows="2"
                  placeholder={t.usageInstructionsPlaceholder}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.expiryDate}</label>
                <input
                  type="text"
                  value={newItem.expiryDate || ""}
                  onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder={t.setExpiryDate}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newItem.sendExpiryReminder}
                  onChange={(e) => setNewItem({ ...newItem, sendExpiryReminder: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm">{t.sendReminder}</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsAddItemDialogOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!newItem.name.trim()}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-2">{t.removeItemConfirm}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t.removeItemDescription}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsConfirmDialogOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {t.cancelRemove}
              </button>
              <button onClick={confirmRemoveItem} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                {t.confirmRemove}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
