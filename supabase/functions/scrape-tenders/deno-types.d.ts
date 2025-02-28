// Type definitions for modules used in Deno
declare module "cheerio" {
  export function load(html: string): CheerioAPI;

  export interface CheerioAPI {
    (selector: string): Cheerio;
    html(): string;
  }

  export interface Cheerio {
    text(): string;
    find(selector: string): Cheerio;
    attr(name: string): string;
    attr(name: string, value: string): Cheerio;
    each(callback: (index: number, element: any) => void): Cheerio;
    html(): string;
  }
}

declare module "date-fns" {
  export function format(date: Date | number, format: string): string;
  export function parseISO(dateString: string): Date;
  export function isValid(date: any): boolean;
  export function addMonths(date: Date, months: number): Date;
  export function addDays(date: Date, days: number): Date;
}

declare module "@supabase/supabase-js" {
  export interface SupabaseClient {
    from(table: string): any;
    storage: any;
    auth: any;
  }

  export function createClient(url: string, key: string): SupabaseClient;
}
