
import React, { useState } from 'react';
import { ChevronDownIcon, CheckIcon, ShieldIcon, SparklesIcon, RefreshIcon, ArrowLeftIcon } from './Icons';

interface FAQPageProps {
    onBack: () => void;
}

interface FAQ {
    question: string;
    answer: string;
}

interface FAQCategory {
    category: string;
    icon: React.ReactNode;
    faqs: FAQ[];
}

export const FAQPage: React.FC<FAQPageProps> = ({ onBack }) => {
    const [openIndex, setOpenIndex] = useState<string | null>(null);

    const faqData: FAQCategory[] = [
        {
            category: "Refunds & Guarantees",
            icon: <ShieldIcon className="w-6 h-6" />,
            faqs: [
                {
                    question: "What is your refund policy?",
                    answer: "Due to the highly personalized nature of ChildTale books, all sales of digital and physical products are final. However, your satisfaction is our priority! Every purchase includes **1 free magic regeneration credit** so you can perfect your story if the first weave isn't exactly what you dreamed of. If there is a manufacturing defect with a hardcover book, please contact us at childtale4@gmail.com."
                },
                {
                    question: "Can I get a free regeneration if I don't like my story?",
                    answer: "Yes! Every **purchased Digital Book** includes 1 free regeneration. For free samples, we provide 1 Welcome Credit for new accounts so you can try the magic again!"
                },
                {
                    question: "Is there a limit on free samples?",
                    answer: "Yes, to keep our magic sparkles high-quality, we limit accounts to **1 free 5-page sample per month**. If you want to create more, upgrade to a Complete 25-page Digital Book!"
                }
            ]
        },
        {
            category: "Safety & Privacy",
            icon: <ShieldIcon className="w-6 h-6" />,
            faqs: [
                {
                    question: "Is ChildTale safe for children?",
                    answer: "Absolutely! ChildTale is COPPA compliant (Children's Online Privacy Protection Act). We never collect personal information from children, and all content is generated with child-appropriate guidelines. Parents maintain full control over the account and content creation."
                },
                {
                    question: "How do you protect my data?",
                    answer: "We use industry-standard encryption for all data transmission and storage. Your payment information is processed securely through PayPal - we never store credit card details. We don't share your data with third parties, and you can delete your account and all associated data at any time."
                },
                {
                    question: "How do you ensure content is appropriate for children?",
                    answer: "All generated stories are designed to be child-friendly, educational, and positive. We use built-in safety filters to prevent inappropriate content. Every story is created with child-appropriate guidelines to ensure a safe, wholesome experience."
                },
                {
                    question: "Do you comply with GDPR and CCPA?",
                    answer: "Yes, we're fully compliant with GDPR (Europe) and CCPA (California). You have the right to access, modify, or delete your data at any time. See our Privacy Policy for complete details."
                }
            ]
        },
        {
            category: "How It Works",
            icon: <SparklesIcon className="w-6 h-6" />,
            faqs: [
                {
                    question: "How are stories generated?",
                    answer: "You provide your child's name, age, appearance details, and a story idea. Our system creates a personalized narrative where your child is the main character. We use advanced technology to maintain character consistency across all 25 pages - your child will look the same throughout the entire book!"
                },
                {
                    question: "Why coloring books instead of regular picture books?",
                    answer: "Coloring books offer a unique interactive experience! Children can personalize their story even further by choosing their own colors. It's also more affordable to print, and the black-and-white line art ensures consistent quality. Plus, our Magic Studio lets kids color digitally before printing!"
                },
                {
                    question: "How long does it take to generate a story?",
                    answer: "Story generation typically takes a few minutes. You'll see real-time progress as your personalized book is created. The exact time can vary depending on server load and the complexity of your story."
                },
                {
                    question: "Can I edit the story after it's generated?",
                    answer: "Currently, you can't edit the text directly. However, you can use your free regeneration credit to create a new variation of your story. We're working on adding more editing features in future updates!"
                }
            ]
        },
        {
            category: "Digital Coloring (Magic Studio)",
            icon: <SparklesIcon className="w-6 h-6" />,
            faqs: [
                {
                    question: "What is the Magic Studio?",
                    answer: "Magic Studio is our browser-based digital coloring tool. It lets you color your story pages on any device (phone, tablet, computer) without needing crayons or markers. Perfect for on-the-go entertainment or when you forget the art supplies!"
                },
                {
                    question: "What tools are available?",
                    answer: "Magic Studio includes: Flood Fill (tap to fill entire areas), Brush (freehand coloring), Eraser, Color Palette (22 preset colors + custom color picker), Undo/Redo, Zoom & Pan, and Auto-Save. All optimized for touch screens!"
                },
                {
                    question: "Does it work on mobile devices?",
                    answer: "Yes! Magic Studio is fully responsive and touch-optimized. It works great on iPhones, iPads, Android phones and tablets. No app download required - it runs directly in your browser."
                },
                {
                    question: "Are my colored pages saved?",
                    answer: "Yes! Your progress is automatically saved to the cloud. You can color on your phone, then continue on your tablet or computer. Colored pages are stored securely and can be downloaded anytime."
                }
            ]
        },
        {
            category: "Print & Shipping",
            icon: <CheckIcon className="w-6 h-6" />,
            faqs: [
                {
                    question: "Are hardcovers available now?",
                    answer: "Yes! Hardcover books are now available for $49.99. They're professionally printed and shipped directly to your door. Create your story first, then select the hardcover option at checkout."
                },
                {
                    question: "What shipping options do you offer?",
                    answer: "We offer standard shipping. FREE for USA addresses! International shipping charges apply and are calculated at checkout based on your location."
                },
                {
                    question: "What's the print quality like?",
                    answer: "Our hardcover books are professionally printed with: High-quality paper (80lb weight), Glossy laminated cover, Perfect binding (like a real book), Crisp black line art perfect for coloring, and Durable construction that lasts for years."
                },
                {
                    question: "Can I print the Digital PDF at home?",
                    answer: "Yes! Our Digital PDF is a high-resolution, 8.5x11\" file that includes the front cover, story pages, and back cover. It's designed to look great on any home printer or at a local print shop like FedEx or Staples."
                }
            ]
        },
        {
            category: "Account & Billing",
            icon: <CheckIcon className="w-6 h-6" />,
            faqs: [
                {
                    question: "Do I need an account for the free sample?",
                    answer: "Yes, but it's quick and free! We just need an email to save your stories and provide access to Magic Studio. No credit card required for the 5-page free sample."
                },
                {
                    question: "What payment methods do you accept?",
                    answer: "We accept all major credit cards and PayPal. All payments are processed securely through PayPal's payment gateway - we never store your card information."
                },
                {
                    question: "Can I purchase multiple books?",
                    answer: "Absolutely! You can create unlimited stories. Each 25-page digital story is $24.99. Use our cart feature to get bulk discounts when ordering 5 or more books at once!"
                },
                {
                    question: "What is the referral program?",
                    answer: "Share ChildTale with your friends! Each person who joins and buys their first book gets 20% off, and YOU get a 10% discount on your next purchase. Stack referrals to get a completely free book!"
                }
            ]
        },
        {
            category: "Technical Requirements",
            icon: <CheckIcon className="w-6 h-6" />,
            faqs: [
                {
                    question: "What browsers are supported?",
                    answer: "ChildTale works on all modern browsers: Chrome, Safari, Firefox, Edge. For the best Magic Studio experience, we recommend Chrome or Safari on mobile devices."
                },
                {
                    question: "Do I need to download an app?",
                    answer: "No! ChildTale is entirely web-based. Just visit our website from any device with a browser. This means it works on Windows, Mac, iPhone, iPad, Android - anything with internet access."
                },
                {
                    question: "How much storage do I need?",
                    answer: "Very little! Your stories are stored in the cloud. Downloaded PDFs are typically 5-10MB for a 25-page book. Colored pages saved in Magic Studio are stored on our servers, not your device."
                },
                {
                    question: "What if I have technical issues?",
                    answer: "Email us at childtale4@gmail.com and we'll help you troubleshoot. Common issues (like slow loading) are usually resolved by refreshing the page or trying a different browser. We typically respond within 24 hours."
                }
            ]
        },
        {
            category: "Regeneration Credits",
            icon: <RefreshIcon className="w-6 h-6" />,
            faqs: [
                {
                    question: "How do regeneration credits work?",
                    answer: "There are two types: 1) **Welcome Credit:** New users get 1 credit to regenerate a free sample. 2) **Included Regeneration:** Every purchased book comes with 1 dedicated regeneration. If you regenerate a purchased book, it uses its own included capability, not your Welcome Credit."
                },
                {
                    question: "What happens to my original story when I regenerate?",
                    answer: "Your original story moves to 'Drafts' and remains accessible. The new regenerated story becomes your active version. You can download or order either version."
                },
                {
                    question: "Can I buy additional regeneration credits?",
                    answer: "No, credits are guaranteed per purchase. Each book you buy comes with its own regeneration safety net. We want to ensure every book you pay for is one you love."
                },
                {
                    question: "Do regeneration credits expire?",
                    answer: "No! Your regeneration credit stays with your book forever. Use it whenever you're ready."
                }
            ]
        }
    ];

    const toggleFAQ = (categoryIndex: number, faqIndex: number) => {
        const key = `${categoryIndex}-${faqIndex}`;
        setOpenIndex(openIndex === key ? null : key);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-24 px-4 md:px-6 font-['Nunito']">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <button
                    onClick={onBack}
                    className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back
                </button>

                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest mb-6">
                        Frequently Asked Questions
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Got Questions?</h1>
                    <p className="text-xl text-slate-500 font-medium">We've got answers! Can't find what you're looking for? Email us at <a href="mailto:childtale4@gmail.com" className="text-indigo-600 hover:underline font-bold">childtale4@gmail.com</a></p>
                </div>

                {/* FAQ Categories */}
                <div className="space-y-8">
                    {faqData.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            {/* Category Header */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                        {category.icon}
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900">{category.category}</h2>
                                </div>
                            </div>

                            {/* FAQs */}
                            <div className="divide-y divide-slate-100">
                                {category.faqs.map((faq, faqIndex) => {
                                    const key = `${categoryIndex}-${faqIndex}`;
                                    const isOpen = openIndex === key;

                                    return (
                                        <div key={faqIndex}>
                                            <button
                                                onClick={() => toggleFAQ(categoryIndex, faqIndex)}
                                                className="w-full text-left p-6 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 group"
                                            >
                                                <span className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                                                    {faq.question}
                                                </span>
                                                <ChevronDownIcon
                                                    className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                                                />
                                            </button>

                                            {isOpen && (
                                                <div className="px-6 pb-6 animate-fade-in">
                                                    <p className="text-slate-600 leading-relaxed font-medium">
                                                        {faq.answer.split('**').map((part, i) =>
                                                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white">
                    <h3 className="text-3xl font-black mb-4">Still have questions?</h3>
                    <p className="text-indigo-100 font-medium mb-6 text-lg">We're here to help! Our team typically responds within 24 hours.</p>
                    <a
                        href="mailto:childtale4@gmail.com"
                        className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-full font-black text-lg hover:bg-indigo-50 transition-all transform hover:-translate-y-1 shadow-xl"
                    >
                        Email Support
                    </a>
                </div>
            </div>
        </div>
    );
};
