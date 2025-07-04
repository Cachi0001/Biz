import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Smartphone, Zap, Users, TrendingUp, Star, Menu, X } from 'lucide-react';

const TypingAnimation = () => {
  const messages = [
    { text: "Your Business, ", highlight: "Simplified", color: "text-primary" },
    { text: "We Are Here for you❤️", highlight: "", color: "" },
    { text: "Your feedback sef na em matter pass", highlight: "", color: "" },
    { text: "Let's Take that business to the next ", highlight: "level", color: "text-primary" }
  ];
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentMessage = messages[currentMessageIndex];
    const fullText = currentMessage.text + currentMessage.highlight;
    
    if (isTyping) {
      if (charIndex < fullText.length) {
        const timeout = setTimeout(() => {
          setCurrentText(fullText.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, 100); // Typing speed
        return () => clearTimeout(timeout);
      } else {
        // Finished typing current message, wait before erasing
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000); // Display complete message for 2 seconds
        return () => clearTimeout(timeout);
      }
    } else {
      if (charIndex > 0) {
        const timeout = setTimeout(() => {
          setCurrentText(fullText.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, 50); // Erasing speed
        return () => clearTimeout(timeout);
      } else {
        // Finished erasing, move to next message
        const timeout = setTimeout(() => {
          setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
          setIsTyping(true);
        }, 500); // Pause before next message
        return () => clearTimeout(timeout);
      }
    }
  }, [charIndex, isTyping, currentMessageIndex, messages]);

  const renderText = () => {
    const currentMessage = messages[currentMessageIndex];
    if (currentMessage.highlight && currentText.includes(currentMessage.highlight)) {
      const parts = currentText.split(currentMessage.highlight);
      return (
        <>
          {parts[0]}
          <span className={currentMessage.color}>{currentMessage.highlight}</span>
          {parts[1]}
        </>
      );
    }
    return currentText;
  };

  return (
    <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 min-h-[4rem] md:min-h-[6rem]">
      {renderText()}
      <span className="animate-pulse text-primary">|</span>
    </h1>
  );
};

const Landing = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-primary text-primary-foreground rounded-lg p-2 font-bold text-xl">
                S
              </div>
              <span className="ml-2 text-2xl font-bold text-foreground">SabiOps</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Pricing
                </a>
                <Link 
                  to="/login" 
                  className="text-primary hover:text-primary/80 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Get Started For Free
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-foreground hover:text-primary p-2 rounded-md transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card border-t border-border">
                <a 
                  href="#features" 
                  className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#pricing" 
                  className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <Link 
                  to="/login" 
                  className="text-primary hover:text-primary/80 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground block px-3 py-2 rounded-md text-base font-medium transition-colors text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started For Free
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-accent to-background py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <TypingAnimation />
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Manage invoices, expenses, and clients with ease. Built specifically for 
              Nigerian SMEs. Start free, upgrade when ready!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center"
              >
                Get Started For Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a 
                href="#features" 
                className="border border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed specifically for Nigerian small and medium enterprises
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="bg-primary text-primary-foreground rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">100% Secure & Private</h3>
              <p className="text-card-foreground/80">Your business data is encrypted and protected with bank-level security</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="bg-primary text-primary-foreground rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Smartphone className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Mobile Responsive</h3>
              <p className="text-card-foreground/80">Access your business anywhere, anytime from any device</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="bg-primary text-primary-foreground rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Quick Setup</h3>
              <p className="text-card-foreground/80">Get started in minutes, not hours. No technical knowledge required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-20 bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl shadow-sm">
              <Users className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Client Management</h3>
              <p className="text-muted-foreground">Keep track of all your customers and their information in one place</p>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-sm">
              <TrendingUp className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Invoice & Payments</h3>
              <p className="text-muted-foreground">Create professional invoices and track payments with Paystack integration</p>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-sm">
              <Star className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Expense Tracking</h3>
              <p className="text-muted-foreground">Monitor your business expenses and generate detailed reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as your business grows
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="bg-accent border-2 border-primary rounded-2xl p-8 text-center">
              <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold mb-4 inline-block">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Free Trial</h3>
              <div className="text-4xl font-bold text-primary mb-2">
                ₦0
              </div>
              <p className="text-base font-medium text-foreground mb-2">No credit card required</p>
              <div className="mb-4">
                <span className="text-lg font-bold text-yellow-400 animate-pulse bg-yellow-100 px-3 py-1 rounded-full">
                  7 days free
                </span>
              </div>
              <p className="text-foreground mb-6">Perfect for getting started</p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <div className="bg-primary rounded-full p-1 mr-3">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-foreground">450 invoices per month</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary rounded-full p-1 mr-3">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-foreground">Client management</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary rounded-full p-1 mr-3">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-foreground">Expense tracking</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary rounded-full p-1 mr-3">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-foreground">Advanced reports</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary rounded-full p-1 mr-3">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-foreground">Offline functionality also available</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary rounded-full p-1 mr-3">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-foreground">And many more...</span>
                </li>
              </ul>
              <Link 
                to="/register" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary py-3 px-6 rounded-lg font-semibold transition-colors block text-center shadow-md"
              >
                Start for Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Simplify Your Business?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of Nigerian entrepreneurs who trust SabiOps to manage their business
          </p>
          <Link 
            to="/register" 
            className="bg-card text-primary hover:bg-card/90 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
          >
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-primary text-primary-foreground rounded-lg p-2 font-bold text-xl">
                  S
                </div>
                <span className="ml-2 text-2xl font-bold">SabiOps</span>
              </div>
              <p className="text-slate-400">
                Simplifying business management for Nigerian SMEs
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 Sabiops SME Nigeria. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

