import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
        <Badge variant="outline" className="mb-4 py-1 px-4 rounded-full bg-background/80 backdrop-blur-sm border-primary/20">
          Your Tender Management Solution
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
          Find and Track <span className="gradient-text">Tenders</span> with Ease
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Discover relevant tenders, streamline your application process, and never miss an opportunity again with our integrated platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="font-semibold">
            <Link to="/register">Get Started Free</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="font-semibold">
            <Link to="/login">Login</Link>
          </Button>
        </div>

        <div className="mt-16 md:mt-20 max-w-5xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none"></div>
          <div className="border border-primary/20 rounded-xl overflow-hidden shadow-2xl bg-card/80 backdrop-blur-sm float-animation">
            <img 
              src="/placeholder.svg" 
              alt="TenderTrack Dashboard" 
              className="w-full"
              style={{ height: "auto" }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Everything You Need</h2>

        <Tabs defaultValue="discover" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="qualify">Qualify</TabsTrigger>
            <TabsTrigger value="track">Track</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4">
            <Card className="overflow-hidden border-primary/20">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-semibold mb-4">Find Relevant Tenders</h3>
                    <p className="text-muted-foreground mb-4">
                      Our AI-powered search helps you discover tenders that match your business profile and capabilities, including AGPO opportunities.
                    </p>
                    <ul className="space-y-2">
                      {["Personalized recommendations", "Real-time notifications", "AGPO tender focus"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-secondary/30 flex items-center justify-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary/60"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qualify" className="space-y-4">
            <Card className="overflow-hidden border-primary/20">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-semibold mb-4">Qualify Opportunities</h3>
                    <p className="text-muted-foreground mb-4">
                      Use our qualification tool to assess if a tender matches your capabilities before investing time in the application.
                    </p>
                    <ul className="space-y-2">
                      {["Requirement analysis", "Capability matching", "Risk assessment"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-secondary/30 flex items-center justify-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary/60"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="track" className="space-y-4">
            <Card className="overflow-hidden border-primary/20">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-semibold mb-4">Track Applications</h3>
                    <p className="text-muted-foreground mb-4">
                      Keep track of all your tender applications in one place with progress tracking and deadline reminders.
                    </p>
                    <ul className="space-y-2">
                      {["Application timelines", "Document management", "Status updates"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-secondary/30 flex items-center justify-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary/60"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center bg-card rounded-2xl p-8 md:p-12 border border-primary/20 shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your tender process?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of businesses finding and winning more tenders with TenderTrack.
          </p>
          <Button asChild size="lg" className="font-semibold">
            <Link to="/register">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}