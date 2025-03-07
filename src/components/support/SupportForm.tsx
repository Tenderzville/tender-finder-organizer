
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle, Loader2 } from 'lucide-react';

interface SupportFormProps {
  userId?: string;
  language: 'en' | 'sw';
}

export const SupportForm: React.FC<SupportFormProps> = ({ userId, language }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const { toast } = useToast();
  
  const translations = {
    en: {
      title: 'Contact Support',
      description: 'Have a question or need help? We\'re here for you.',
      name: 'Your Name',
      email: 'Email Address',
      category: 'Category',
      categories: {
        general: 'General Inquiry',
        account: 'Account Issues',
        tender: 'Tender Questions',
        payment: 'Payment & Billing',
        suggestion: 'Suggestion',
        bug: 'Report a Bug',
        other: 'Other'
      },
      subject: 'Subject',
      message: 'Your Message',
      submit: 'Submit Request',
      submitting: 'Submitting...',
      success_title: 'Request Submitted',
      success_message: 'Thank you for contacting us. We\'ll get back to you as soon as possible.',
      new_request: 'Submit Another Request',
      placeholders: {
        name: 'Enter your full name',
        email: 'Enter your email address',
        subject: 'Brief description of your issue',
        message: 'Please provide as much detail as possible...'
      },
      required: 'This field is required',
      valid_email: 'Please enter a valid email address',
      min_message: 'Message must be at least 20 characters',
      error: 'Failed to submit your request. Please try again.'
    },
    sw: {
      title: 'Wasiliana na Msaada',
      description: 'Una swali au unahitaji usaidizi? Tuko hapa kwa ajili yako.',
      name: 'Jina Lako',
      email: 'Anwani ya Barua Pepe',
      category: 'Kategoria',
      categories: {
        general: 'Uchunguzi wa Jumla',
        account: 'Masuala ya Akaunti',
        tender: 'Maswali ya Zabuni',
        payment: 'Malipo na Bili',
        suggestion: 'Pendekezo',
        bug: 'Ripoti Hitilafu',
        other: 'Nyingine'
      },
      subject: 'Somo',
      message: 'Ujumbe Wako',
      submit: 'Wasilisha Ombi',
      submitting: 'Inawasilisha...',
      success_title: 'Ombi Limewasilishwa',
      success_message: 'Asante kwa kuwasiliana nasi. Tutawasiliana nawe haraka iwezekanavyo.',
      new_request: 'Wasilisha Ombi Lingine',
      placeholders: {
        name: 'Ingiza jina lako kamili',
        email: 'Ingiza anwani yako ya barua pepe',
        subject: 'Maelezo mafupi ya suala lako',
        message: 'Tafadhali toa maelezo mengi iwezekanavyo...'
      },
      required: 'Sehemu hii inahitajika',
      valid_email: 'Tafadhali ingiza anwani halali ya barua pepe',
      min_message: 'Ujumbe lazima uwe na angalau herufi 20',
      error: 'Imeshindwa kuwasilisha ombi lako. Tafadhali jaribu tena.'
    }
  };
  
  const t = translations[language];
  
  const validateForm = () => {
    if (!name) {
      toast({
        title: 'Error',
        description: `${t.name}: ${t.required}`,
        variant: 'destructive',
      });
      return false;
    }
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: 'Error',
        description: t.valid_email,
        variant: 'destructive',
      });
      return false;
    }
    
    if (!subject) {
      toast({
        title: 'Error',
        description: `${t.subject}: ${t.required}`,
        variant: 'destructive',
      });
      return false;
    }
    
    if (!message || message.length < 20) {
      toast({
        title: 'Error',
        description: t.min_message,
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('support_requests')
        .insert({
          user_id: userId || null,
          name,
          email,
          category,
          subject,
          message,
          status: 'new',
          created_at: new Date().toISOString(),
        });
        
      if (error) throw error;
      
      setSubmitted(true);
      // Reset form
      setName('');
      setEmail('');
      setCategory('general');
      setSubject('');
      setMessage('');
      
    } catch (error) {
      console.error('Error submitting support request:', error);
      toast({
        title: 'Error',
        description: t.error,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleStartNew = () => {
    setSubmitted(false);
  };
  
  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-green-600">{t.success_title}</CardTitle>
          <CardDescription className="text-center">{t.success_message}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button onClick={handleStartNew}>{t.new_request}</Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <HelpCircle className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription className="text-center">{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">{t.name}</label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.placeholders.name}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">{t.email}</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.placeholders.email}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">{t.category}</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t.category} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(t.categories).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">{t.subject}</label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t.placeholders.subject}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">{t.message}</label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.placeholders.message}
              rows={5}
              required
            />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={submitting} 
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.submitting}
            </>
          ) : t.submit}
        </Button>
      </CardFooter>
    </Card>
  );
};
