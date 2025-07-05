import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 7, 2025</p>

          <div className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Introduction</h2>
            <p className="text-foreground mb-4">
              At SabiOps, we are committed to protecting your privacy and ensuring the security of your personal and business information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our business management platform. 
              We understand the importance of data privacy, especially for Nigerian Small and Medium Enterprises (SMEs) who trust us with their sensitive business data.
            </p>
            <p className="text-foreground mb-4">
              By using SabiOps, you consent to the data practices described in this Privacy Policy. 
              If you do not agree with the practices described in this policy, please do not use our service.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">2.1 Personal Information</h3>
            <p className="text-foreground mb-4">
              When you register for SabiOps, we collect personal information that you voluntarily provide, including:
            </p>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Full name (first and last name)</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Business name and information</li>
              <li>Password (encrypted and stored securely)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">2.2 Business Data</h3>
            <p className="text-foreground mb-4">
              As you use SabiOps to manage your business, we collect and store business-related information, including:
            </p>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Customer information (names, contact details, purchase history)</li>
              <li>Product and service information</li>
              <li>Invoice and payment data</li>
              <li>Expense records and receipts</li>
              <li>Sales transactions and reports</li>
              <li>Team member information (for business owners who add salespeople)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">2.3 Technical Information</h3>
            <p className="text-foreground mb-4">
              We automatically collect certain technical information when you use our service:
            </p>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Device information (type, operating system)</li>
              <li>Usage patterns and feature interactions</li>
              <li>Log files and error reports</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-foreground mb-4">
              We use the information we collect for the following purposes:
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">3.1 Service Provision</h3>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Provide and maintain the SabiOps platform</li>
              <li>Process your business transactions and generate reports</li>
              <li>Enable invoice creation and payment processing</li>
              <li>Facilitate customer and expense management</li>
              <li>Provide customer support and technical assistance</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">3.2 Communication</h3>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Send important service notifications and updates</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Send promotional materials (with your consent)</li>
              <li>Notify you about new features and improvements</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">3.3 Service Improvement</h3>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Analyze usage patterns to improve our platform</li>
              <li>Develop new features and functionalities</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Conduct research and analytics (using aggregated, anonymized data)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-foreground mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">4.1 Service Providers</h3>
            <p className="text-foreground mb-4">
              We may share information with trusted third-party service providers who assist us in operating our platform:
            </p>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Paystack (for payment processing)</li>
              <li>Cloud hosting providers (for data storage and platform hosting)</li>
              <li>Email service providers (for communication)</li>
              <li>Analytics providers (for platform improvement)</li>
            </ul>
            <p className="text-foreground mb-4">
              These service providers are contractually obligated to protect your information and use it only for the specific services they provide to us.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">4.2 Legal Requirements</h3>
            <p className="text-foreground mb-4">
              We may disclose your information if required by law or in response to valid legal processes, such as:
            </p>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Court orders or subpoenas</li>
              <li>Government investigations</li>
              <li>Compliance with Nigerian data protection laws</li>
              <li>Protection of our rights, property, or safety</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">4.3 Business Transfers</h3>
            <p className="text-foreground mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity. 
              We will notify you of any such change and ensure that your data continues to be protected under this Privacy Policy.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Data Security</h2>
            <p className="text-foreground mb-4">
              We implement robust security measures to protect your information:
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">5.1 Technical Safeguards</h3>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>SSL/TLS encryption for all data transmission</li>
              <li>AES-256 encryption for data at rest</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Secure cloud infrastructure with redundancy and backup systems</li>
              <li>Multi-factor authentication options</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">5.2 Administrative Safeguards</h3>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Limited access to personal data on a need-to-know basis</li>
              <li>Regular employee training on data protection</li>
              <li>Incident response procedures for data breaches</li>
              <li>Regular review and update of security policies</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Data Retention</h2>
            <p className="text-foreground mb-4">
              We retain your information for as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Account information: Retained while your account is active and for 30 days after account closure</li>
              <li>Business data: Retained according to your subscription plan and Nigerian business record requirements</li>
              <li>Transaction records: Retained for 7 years as required by Nigerian financial regulations</li>
              <li>Support communications: Retained for 2 years for quality assurance purposes</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Your Rights and Choices</h2>
            <p className="text-foreground mb-4">
              You have several rights regarding your personal information:
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">7.1 Access and Portability</h3>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Request access to your personal information</li>
              <li>Export your business data in standard formats</li>
              <li>Receive a copy of your data for transfer to another service</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">7.2 Correction and Deletion</h3>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Update or correct your personal information through your account settings</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt-out of promotional communications</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">7.3 Communication Preferences</h3>
            <p className="text-foreground mb-4">
              You can control the types of communications you receive from us:
            </p>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Unsubscribe from marketing emails using the link in each email</li>
              <li>Adjust notification settings in your account dashboard</li>
              <li>Contact our support team to update your preferences</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-foreground mb-4">
              SabiOps uses cookies and similar technologies to enhance your experience:
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">8.1 Types of Cookies</h3>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Essential cookies: Required for basic platform functionality</li>
              <li>Performance cookies: Help us understand how you use our platform</li>
              <li>Functional cookies: Remember your preferences and settings</li>
              <li>Analytics cookies: Provide insights for platform improvement</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">8.2 Cookie Management</h3>
            <p className="text-foreground mb-4">
              You can control cookies through your browser settings. However, disabling certain cookies may affect the functionality of SabiOps.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">9. International Data Transfers</h2>
            <p className="text-foreground mb-4">
              While SabiOps is designed for Nigerian businesses, some of our service providers may be located outside Nigeria. 
              When we transfer data internationally, we ensure appropriate safeguards are in place:
            </p>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Contractual data protection clauses with service providers</li>
              <li>Compliance with international data protection standards</li>
              <li>Regular monitoring of data transfer practices</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">10. Children's Privacy</h2>
            <p className="text-foreground mb-4">
              SabiOps is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. 
              If we become aware that we have collected personal information from a child, we will take steps to delete such information promptly.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-foreground mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
              We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Posting the updated policy on our website</li>
              <li>Sending an email notification to registered users</li>
              <li>Displaying a prominent notice in the SabiOps platform</li>
            </ul>
            <p className="text-foreground mb-4">
              Your continued use of SabiOps after any changes indicates your acceptance of the updated Privacy Policy.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">12. Compliance with Nigerian Laws</h2>
            <p className="text-foreground mb-4">
              SabiOps is committed to complying with Nigerian data protection laws, including:
            </p>
            <ul className="list-disc pl-6 text-foreground mb-4 space-y-2">
              <li>Nigeria Data Protection Regulation (NDPR) 2019</li>
              <li>Nigerian Communications Commission (NCC) guidelines</li>
              <li>Central Bank of Nigeria (CBN) data protection requirements</li>
              <li>Other applicable Nigerian privacy and data protection laws</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">13. Contact Information</h2>
            <p className="text-foreground mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-accent p-4 rounded-lg">
              <p className="text-foreground"><strong>SabiOps Data Protection Officer</strong></p>
              <p className="text-foreground">Email: privacy@sabiops.com</p>
              <p className="text-foreground">Phone: +234 (0) 800 SABIOPS</p>
              <p className="text-foreground">Address: Lagos, Nigeria</p>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">14. Data Subject Rights Requests</h2>
            <p className="text-foreground mb-4">
              To exercise your rights under this Privacy Policy or applicable data protection laws, please submit a request to privacy@sabiops.com. 
              We will respond to your request within 30 days and may require verification of your identity before processing your request.
            </p>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                By using SabiOps, you acknowledge that you have read, understood, and agree to the collection and use of your information 
                as described in this Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

