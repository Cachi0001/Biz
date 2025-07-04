import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center text-primary hover:text-primary/80 transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center">
              <div className="bg-primary text-primary-foreground rounded-lg p-2 font-bold text-xl mr-3">
                S
              </div>
              <span className="text-2xl font-bold text-foreground">SabiOps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 7, 2025</p>

          <div className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-foreground mb-4">
              By accessing and using SabiOps ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Description of Service</h2>
            <p className="text-foreground mb-4">
              SabiOps is a comprehensive business management platform designed specifically for Nigerian Small and Medium Enterprises (SMEs). 
              Our service provides tools for invoice management, expense tracking, customer relationship management, payment processing, 
              and business analytics to help Nigerian entrepreneurs streamline their operations and grow their businesses.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. User Accounts and Registration</h2>
            <p className="text-foreground mb-4">
              To access certain features of SabiOps, you must register for an account using your email address and phone number. 
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. 
              You agree to notify us immediately of any unauthorized use of your account.
            </p>
            <p className="text-foreground mb-4">
              You must provide accurate, current, and complete information during the registration process and update such information 
              to keep it accurate, current, and complete. We reserve the right to suspend or terminate your account if any information 
              provided is inaccurate, false, or incomplete.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Free Trial and Subscription</h2>
            <p className="text-foreground mb-4">
              SabiOps offers a 7-day free trial period for new users. No credit card is required to start your free trial. 
              During the trial period, you have access to all features of the platform. After the trial period expires, 
              continued use of the service requires a paid subscription.
            </p>
            <p className="text-foreground mb-4">
              Subscription fees are billed in Nigerian Naira (₦) and are subject to applicable taxes. 
              We reserve the right to change our pricing at any time, but price changes will not affect your current billing cycle.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Acceptable Use Policy</h2>
            <p className="text-foreground mb-4">
              You agree to use SabiOps only for lawful purposes and in accordance with these Terms of Service. You agree not to:
            </p>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction (including but not limited to copyright laws)</li>
              <li>Transmit any worms, viruses, or any code of a destructive nature</li>
              <li>Attempt to gain unauthorized access to our systems or networks</li>
              <li>Use the service to send spam or unsolicited communications</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Data Security and Privacy</h2>
            <p className="text-foreground mb-4">
              We take the security of your business data seriously. All data transmitted through SabiOps is encrypted using 
              industry-standard SSL/TLS protocols. Your business information, customer data, and financial records are stored 
              securely and are never shared with third parties without your explicit consent, except as required by law.
            </p>
            <p className="text-foreground mb-4">
              For detailed information about how we collect, use, and protect your data, please refer to our Privacy Policy.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Payment Processing</h2>
            <p className="text-foreground mb-4">
              SabiOps integrates with Paystack for secure payment processing. When you use our payment features, 
              you are also subject to Paystack's terms of service and privacy policy. We do not store your payment card information; 
              all payment data is handled securely by our payment processor.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Intellectual Property Rights</h2>
            <p className="text-foreground mb-4">
              The SabiOps service and its original content, features, and functionality are and will remain the exclusive property 
              of SabiOps and its licensors. The service is protected by copyright, trademark, and other laws. 
              Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
            </p>
            <p className="text-foreground mb-4">
              You retain ownership of all data you input into SabiOps. By using our service, you grant us a limited, 
              non-exclusive license to use your data solely for the purpose of providing the service to you.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">9. Service Availability and Modifications</h2>
            <p className="text-foreground mb-4">
              We strive to maintain high service availability, but we do not guarantee that SabiOps will be available 
              100% of the time. We may experience downtime for maintenance, updates, or due to factors beyond our control. 
              We will make reasonable efforts to notify users of planned maintenance in advance.
            </p>
            <p className="text-foreground mb-4">
              We reserve the right to modify, suspend, or discontinue any part of the service at any time. 
              We will provide reasonable notice of significant changes that may affect your use of the service.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">10. Limitation of Liability</h2>
            <p className="text-foreground mb-4">
              To the maximum extent permitted by applicable law, SabiOps shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
              or other intangible losses, resulting from your use of the service.
            </p>
            <p className="text-foreground mb-4">
              In no event shall our total liability to you for all damages exceed the amount you paid us in the 
              twelve (12) months preceding the event giving rise to the liability.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">11. Indemnification</h2>
            <p className="text-foreground mb-4">
              You agree to defend, indemnify, and hold harmless SabiOps and its officers, directors, employees, and agents 
              from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees 
              arising out of or relating to your violation of these Terms of Service or your use of the service.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">12. Termination</h2>
            <p className="text-foreground mb-4">
              You may terminate your account at any time by contacting our support team. Upon termination, 
              your right to use the service will cease immediately. We may terminate or suspend your account 
              immediately, without prior notice or liability, for any reason, including breach of these Terms of Service.
            </p>
            <p className="text-foreground mb-4">
              Upon termination, we will provide you with the ability to export your data for a period of 30 days, 
              after which your data may be permanently deleted from our systems.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">13. Governing Law</h2>
            <p className="text-foreground mb-4">
              These Terms of Service shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. 
              Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of Nigeria.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">14. Changes to Terms</h2>
            <p className="text-foreground mb-4">
              We reserve the right to update or modify these Terms of Service at any time without prior notice. 
              Your continued use of the service after any such changes constitutes your acceptance of the new Terms of Service. 
              We encourage you to review these terms periodically.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">15. Contact Information</h2>
            <p className="text-foreground mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-accent p-4 rounded-lg">
              <p className="text-foreground"><strong>SabiOps Support Team</strong></p>
              <p className="text-foreground">Email: support@sabiops.com</p>
              <p className="text-foreground">Phone: +234 (0) 800 SABIOPS</p>
              <p className="text-foreground">Address: Lagos, Nigeria</p>
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                By using SabiOps, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

