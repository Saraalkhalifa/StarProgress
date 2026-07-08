import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Card } from '../components/ui';

export function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-sky-500 px-8 py-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-7 h-7" />
              <h1 className="text-2xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-blue-100 text-sm">Action Heroes — Child-Safe Platform</p>
          </div>

          <div className="p-8 space-y-6 text-gray-700 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">1. Who We Are</h2>
              <p>Action Heroes is a points-based reward platform for children aged 10 and above. It helps children track positive actions such as reading, helping, volunteering, sports, and good behavior.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">2. What Information We Collect</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Full name and username (used to identify accounts)</li>
                <li>Email address (used for login and notifications)</li>
                <li>Date of birth (used only to verify minimum age of 10)</li>
                <li>Optional parent or guardian email address</li>
                <li>Activity descriptions submitted by the child</li>
                <li>Optional proof images uploaded for activity verification</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>To create and manage user accounts</li>
                <li>To track activity submissions and award Hero Points</li>
                <li>To allow parents to monitor their child's progress</li>
                <li>To send email notifications about activity reviews</li>
                <li>To display the Hero Board (leaderboard) — only username, level, and points are shown</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">4. What We Do NOT Show Publicly</h2>
              <p className="font-medium text-green-700 mb-2">We protect children's privacy seriously. We never show:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Full names publicly</li>
                <li>Email addresses or phone numbers</li>
                <li>Date of birth</li>
                <li>Parent or guardian information</li>
                <li>Uploaded proof photos (visible only to the child, their linked parent, and authorized admins)</li>
                <li>Private addresses or school information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">5. Proof Image Safety</h2>
              <p>When uploading proof photos for activities, please follow these rules:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Do <strong>not</strong> upload photos of people's faces</li>
                <li>Do <strong>not</strong> upload private documents, addresses, or school IDs</li>
                <li>Upload safe, activity-related photos only (e.g., a book cover, a drawing, sports equipment)</li>
                <li>All uploaded images are private and visible only to authorized users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">6. Data Retention and Deletion</h2>
              <p>You have the right to request deletion of your account and personal data. Contact the platform administrator. We will anonymize your data while keeping system totals consistent.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">7. Parent and Guardian Rights</h2>
              <p>Parents and guardians have the right to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>View their child's activity history and points</li>
                <li>Approve or deny Hero Reward requests</li>
                <li>Request account deletion for their child</li>
                <li>Contact administrators with any privacy concerns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">8. Password Security</h2>
              <p>All passwords are securely hashed and never stored or displayed in plain text. We will never ask you to share your password.</p>
            </section>

            <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
              Last updated: July 2026. If you have questions about this privacy policy, please contact the platform administrator.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
