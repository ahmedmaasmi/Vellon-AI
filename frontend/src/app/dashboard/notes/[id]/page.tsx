'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Save, Trash2, Wand2, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

interface NoteFormValues {
  title: string;
  content: string;
}

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<'summary' | 'keywords' | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[] | null>(null);

  const { register, handleSubmit, reset, watch } = useForm<NoteFormValues>();

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await api.get(`/api/v1/notes/${noteId}`);
        const note = response.data;
        reset({
          title: note.title,
          content: note.content,
        });
      } catch (error) {
        console.error('Failed to fetch note:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (noteId) {
      fetchNote();
    }
  }, [noteId, reset, router]);

  const onSubmit = async (data: NoteFormValues) => {
    setIsSaving(true);
    try {
      await api.put(`/api/v1/notes/${noteId}`, data);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await api.delete(`/api/v1/notes/${noteId}`);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleSummarize = async () => {
    setAiLoading('summary');
    try {
      // Save first to ensure latest content is summarized
      await handleSubmit(onSubmit)();
      
      const response = await api.get(`/api/v1/notes/${noteId}/summary`);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Failed to summarize:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleExtractKeywords = async () => {
    setAiLoading('keywords');
    try {
      // Save first
      await handleSubmit(onSubmit)();

      const response = await api.get(`/api/v1/notes/${noteId}/keywords`);
      setKeywords(response.data.keywords);
    } catch (error) {
      console.error('Failed to extract keywords:', error);
      alert('Failed to extract keywords. Please try again.');
    } finally {
      setAiLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between sticky top-0 bg-gray-50 py-4 z-10 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Note</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
            {isSaving ? <Spinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Input
            {...register('title')}
            className="text-2xl font-bold border-none px-0 focus-visible:ring-0 bg-transparent placeholder:text-gray-400"
            placeholder="Note Title"
          />
          <textarea
            {...register('content')}
            className="w-full min-h-[500px] p-4 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            placeholder="Start typing..."
          />
        </div>

        {/* AI Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button 
                  variant="secondary" 
                  className="w-full justify-start" 
                  onClick={handleSummarize}
                  disabled={!!aiLoading}
                >
                  {aiLoading === 'summary' ? <Spinner size="sm" className="mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Summarize Note
                </Button>
                
                {summary && (
                  <div className="p-3 bg-purple-50 rounded-md text-sm text-purple-900 mt-2 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-semibold mb-1">Summary:</h4>
                    {summary}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Button 
                  variant="secondary" 
                  className="w-full justify-start"
                  onClick={handleExtractKeywords}
                  disabled={!!aiLoading}
                >
                  {aiLoading === 'keywords' ? <Spinner size="sm" className="mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Extract Keywords
                </Button>

                {keywords && (
                  <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                    {keywords.map((keyword, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
