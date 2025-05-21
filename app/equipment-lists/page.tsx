"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ListChecks, ChevronLeft, ChevronRight, PlusCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lfmxtaefgvjbuipcdcya.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXh0YWVmZ3ZqYnVpcGNkY3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTg5NDksImV4cCI6MjA1OTg3NDk0OX0.Rl-QQhQxQXTzgJLQYQKRGJDEQQDcnrJCBj0aCxRKAXs"

// Create a singleton Supabase client
const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Mock data for equipment lists
const mockEquipmentLists = [
  {
    id: "1",
    title: "רשימת ציוד לחירום",
    description: "ציוד חיוני למקרה חירום",
    itemCount: 12,
    created_at: "2023-10-15T10:30:00Z",
  },
  {
    id: "2",
    title: "ציוד למקלט",
    description: "פריטים שיש להחזיק במקלט",
    itemCount: 8,
    created_at: "2023-10-10T14:20:00Z",
  },
  {
    id: "3",
    title: "ערכת עזרה ראשונה",
    description: "ציוד רפואי בסיסי",
    itemCount: 15,
    created_at: "2023-09-28T09:15:00Z",
  },
]

// Translations
const translations = {
  he: {
    pageTitle: "רשימות ציוד",
    pageDescription: "נהל את רשימות הציוד שלך למצבי חירום",
    createNewList: "צור רשימה חדשה",
    createWithAI: "צור רשימה עם AI",
    viewList: "צפה ברשימה",
    editList: "ערוך רשימה",
    deleteList: "מחק רשימה",
    noLists: "עדיין לא יצרת רשימות ציוד",
    noListsDescription: "צור את הרשימה הראשונה שלך כדי להתחיל",
    loading: "טוען רשימות ציוד...",
    items: "פריטים",
    confirmDelete: "האם אתה בטוח שברצונך למחוק רשימה זו?",
    confirmDeleteDescription: "פעולה זו תמחק את הרשימה ואת כל הפריטים שבה. לא ניתן לבטל פעולה זו.",
    cancel: "ביטול",
    delete: "מחק",
    errorLoading: "שגיאה בטעינת רשימות הציוד",
    errorDeleting: "שגיאה במחיקת הרשימה",
  },
  en: {
    pageTitle: "Equipment Lists",
    pageDescription: "Manage your emergency equipment lists",
    createNewList: "Create New List",
    createWithAI: "Create with AI",
    viewList: "View List",
    editList: "Edit List",
    deleteList: "Delete List",
    noLists: "You haven't created any equipment lists yet",
    noListsDescription: "Create your first list to get started",
    loading: "Loading equipment lists...",
    items: "items",
    confirmDelete: "Are you sure you want to delete this list?",
    confirmDeleteDescription: "This action will delete the list and all its items. This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    errorLoading: "Error loading equipment lists",
    errorDeleting: "Error deleting the list",
  },
}

export default function EquipmentListsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [equipmentLists, setEquipmentLists] = useState([]);
  const [isRTL, setIsRTL] = useState(true);
  const [error, setError] = useState("");
  const [listToDelete, setListToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [language, setLanguage] = useState('he');
  const [t, setT] = useState(translations.he);

  // Get language and direction
  useEffect(() => {
    if (typeof window !== "undefined") {
      const docLang = document.documentElement.lang || "he";
      setLanguage(docLang);
      setT(translations[docLang] || translations.he);
      setIsRTL(docLang === "he" || docLang === "ar");
    }
  }, []);

  // Fetch equipment lists
  useEffect(() => {
    const fetchLists = async () => {
      setIsLoading(true);
      setError("");

      try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
          .from('equipment_lists')
          .select('*, equipment_items(count)')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Process the data to include item counts
        const processedData = data.map(list => ({
          ...list,
          itemCount: list.equipment_items?.[0]?.count || 0
        }));
        
        setEquipmentLists(processedData);
      } catch (error) {
        console.error("Error fetching equipment lists:", error);
        setError(t.errorLoading);
        // Fallback to mock data
        setEquipmentLists(mockEquipmentLists);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, [t]);

  // Handle delete list
  const handleDeleteList = async () => {
    if (!listToDelete) return;
    
    try {
      const supabase = createSupabaseClient();
      
      // Delete items first (foreign key constraint)
      await supabase
        .from('equipment_items')
        .delete()
        .eq('list_id', listToDelete.id);
      
      // Delete the list
      const { error } = await supabase
        .from('equipment_lists')
        .delete()
        .eq('id', listToDelete.id);
      
      if (error) throw error;
      
      // Update the list
      setEquipmentLists(equipmentLists.filter(list => list.id !== listToDelete.id));
      
    } catch (error) {
      console.error("Error deleting list:", error);
      setError(t.errorDeleting);
    } finally {
      setListToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (list) => {
    setListToDelete(list);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <ListChecks className="text-purple-600" /> {t.pageTitle}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">{t.pageDescription}</p>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <Link href="/equipment">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t.createNewList}
          </Button>
        </Link>
        <Link href="/equipment?ai=true">
          <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20">
            <ListChecks className="mr-2 h-4 w-4" />
            {t.createWithAI}
          </Button>
        </Link>
      </div>

      {equipmentLists.length > 0 ? (
        <div className="space-y-4">
          {equipmentLists.map((list) => (
            <Card key={list.id} className="shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0 mr-4">
                    <h2 className="text-xl font-semibold text-purple-700 dark:text-gray-100">{list.title}</h2>
                    {list.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{list.description}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{list.itemCount} {t.items}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/equipment?listId=${list.id}`}>
                      <Button variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-600">
                        {isRTL ? <ChevronLeft className="ml-1 h-4 w-4" /> : <ChevronRight className="mr-1 h-4 w-4" />}
                        {t.viewList}
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => openDeleteDialog(list)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-md dark:bg-gray-800">
          <CardContent className="p-6 text-center">
            <ListChecks className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{t.noLists}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.noListsDescription}</p>
            <Link href="/equipment">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t.createNewList}
              </Button>
            </Link>\
          </CardContent>
