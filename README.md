# Tender Management System

## About

This application is a comprehensive tender management system designed to help businesses, particularly small and medium enterprises (SMEs), access and qualify for procurement opportunities in Kenya. The system has a special focus on AGPO (Access to Government Procurement Opportunities) tenders targeted at youth, women, and persons with disabilities.

## Features

- **Tender Discovery**: Automated scraping of tenders from multiple sources including government portals and private sector
- **AGPO Focus**: Special identification and filtering of tenders reserved for youth, women, and persons with disabilities
- **Qualification Tool**: Assessment of business eligibility for specific tenders
- **Supplier Collaboration**: Platform for suppliers to collaborate on joint ventures
- **AI-powered Assistance**: (To be implemented) Smart analysis of tender requirements and qualification

## Technical Implementation

- React + TypeScript frontend with Tailwind CSS styling
- Supabase backend for database and serverless functions
- Automated scrapers that run on a schedule to collect the latest tenders
- RESTful API for data access

## Scrapers

The system includes sophisticated scrapers that:
- Can detect and adapt to different website structures (SPA support)
- Parse tender details including deadlines, categories, and requirements
- Identify AGPO-specific procurement opportunities
- Handle paginated results and authentication where needed

## Privacy Notice

This application respects user privacy. We do not collect or store any personal information beyond what is necessary for the functioning of the application. Tender data is publicly available information that is aggregated for ease of access.

## Development

### Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`

## Roadmap

- AI-powered tender recommendation engine
- Document generation for tender applications
- Mobile application for on-the-go tender management
- Enhanced collaboration tools for supplier partnerships
- Integration with government procurement systems