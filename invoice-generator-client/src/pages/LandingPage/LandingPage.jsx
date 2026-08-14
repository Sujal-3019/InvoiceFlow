import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiCheck,
  FiZap,
  FiShield,
  FiGlobe,
  FiCreditCard,
  FiBarChart2,
  FiUsers,
  FiMail,
  FiPhone,
  FiStar,
  FiChevronDown,
  FiFileText,
  FiMoon,
  FiSun,
  FiArrowRight,
} from 'react-icons/fi';

import Avatar from '../../components/ui/Avatar';
import { useTheme } from '../../context/ThemeContext';

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();

  // =========================================================
  // FEATURES
  // =========================================================

  const features = [
    {
      icon: FiZap,
      title: 'Lightning Fast',
      description:
        'Create professional invoices quickly without unnecessary complexity.',
    },
    {
      icon: FiShield,
      title: 'Secure & Reliable',
      description:
        'Keep your business and customer information protected with secure infrastructure.',
    },
    {
      icon: FiGlobe,
      title: 'Built for Modern Business',
      description:
        'Manage invoices, clients, and products from one centralized workspace.',
    },
    {
      icon: FiCreditCard,
      title: 'Payment Tracking',
      description:
        'Keep track of invoice payment status and know exactly what is pending.',
    },
    {
      icon: FiBarChart2,
      title: 'Business Insights',
      description:
        'Understand your business performance with clear financial insights.',
    },
    {
      icon: FiUsers,
      title: 'Client Management',
      description:
        'Store and organize all your client information in one convenient place.',
    },
  ];

  // =========================================================
  // TESTIMONIALS
  // =========================================================

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Freelance Designer',
      company: 'DesignStudio',
      content:
        'InvoiceFlow has transformed how I handle billing. It is fast, professional, and incredibly easy to use.',
      avatar: 'SJ',
    },
    {
      name: 'Michael Chen',
      role: 'Business Owner',
      company: 'TechStart Inc',
      content:
        'We have significantly reduced the time spent creating and managing invoices since using InvoiceFlow.',
      avatar: 'MC',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Project Manager',
      company: 'Global Solutions',
      content:
        'The clean interface makes managing clients and invoices simple. Everything I need is in one place.',
      avatar: 'ER',
    },
  ];

  // =========================================================
  // FAQ
  // =========================================================

  const faqs = [
    {
      question: 'What is InvoiceFlow?',
      answer:
        'InvoiceFlow is a modern business management platform that helps you create and manage invoices, clients, and products from one simple dashboard.',
    },
    {
      question: 'Can I create professional invoices?',
      answer:
        'Yes. InvoiceFlow allows you to create professional invoices with your business information, client details, products, quantities, taxes, discounts, and totals.',
    },
    {
      question: 'Can I manage my clients?',
      answer:
        'Yes. You can create, edit, view, and manage your client information directly from your InvoiceFlow dashboard.',
    },
    {
      question: 'Can I manage products?',
      answer:
        'Yes. InvoiceFlow provides product management so you can maintain your product catalog and use products while creating invoices.',
    },
    {
      question: 'Is InvoiceFlow secure?',
      answer:
        'InvoiceFlow is designed with security in mind. Your account and business information are protected using modern authentication and secure backend practices.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-dark-bg/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between h-16">

            {/* Logo */}

            <Link to="/" className="flex items-center gap-2.5">

              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <FiFileText
                  className="text-white"
                  size={19}
                />
              </div>

              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                InvoiceFlow
              </span>

            </Link>

            {/* Desktop Navigation */}

            <div className="hidden md:flex items-center gap-8">

              <a
                href="#features"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                Features
              </a>

              <a
                href="#testimonials"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                Testimonials
              </a>

              <a
                href="#faq"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                FAQ
              </a>

            </div>

            {/* Right Navigation */}

            <div className="flex items-center gap-2 sm:gap-3">

              {/* Theme Toggle */}

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={
                  theme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
                className="
                  w-10 h-10
                  flex items-center justify-center
                  rounded-xl
                  text-gray-600 dark:text-gray-300
                  bg-gray-100 dark:bg-gray-800
                  hover:bg-gray-200 dark:hover:bg-gray-700
                  transition-all duration-200
                "
              >
                {theme === 'dark' ? (
                  <FiSun size={19} />
                ) : (
                  <FiMoon size={19} />
                )}
              </button>

              {/* Sign In */}

              <Link
                to="/login"
                className="
                  hidden sm:inline-flex
                  items-center justify-center
                  px-4 py-2
                  rounded-xl
                  text-sm font-semibold
                  text-gray-700 dark:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-all duration-200
                "
              >
                Sign In
              </Link>

              {/* Get Started */}

              <Link
                to="/register"
                className="
                  inline-flex items-center justify-center
                  px-4 sm:px-5 py-2.5
                  rounded-xl
                  text-sm font-semibold
                  text-white
                  bg-primary
                  hover:bg-primary-dark
                  shadow-sm hover:shadow-md
                  transition-all duration-200
                "
              >
                Get Started
              </Link>

            </div>

          </div>

        </div>

      </nav>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden py-20 lg:py-28">

        {/* Background */}

        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent dark:from-primary/10" />

          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-4xl mx-auto">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >

              {/* Badge */}

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/10 text-primary text-sm font-semibold mb-7">

                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />

                Simple invoicing for modern businesses

              </div>

              {/* Heading */}

              <h1 className="
                text-4xl
                sm:text-5xl
                lg:text-6xl
                font-bold
                tracking-tight
                text-gray-900
                dark:text-white
                leading-tight
                mb-6
              ">

                Professional Invoicing

                <br />

                <span className="text-primary">
                  Made Simple
                </span>

              </h1>

              {/* Description */}

              <p className="
                text-lg
                sm:text-xl
                text-gray-600
                dark:text-gray-400
                max-w-2xl
                mx-auto
                leading-relaxed
                mb-10
              ">

                Create, manage, and track your invoices, clients,
                and products from one powerful and intuitive workspace.

              </p>

              {/* Hero Buttons */}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

                <Link
                  to="/register"
                  className="
                    group
                    inline-flex items-center justify-center
                    px-7 py-3.5
                    rounded-xl
                    bg-primary
                    text-white
                    font-semibold
                    shadow-lg shadow-primary/20
                    hover:bg-primary-dark
                    hover:shadow-xl
                    hover:-translate-y-0.5
                    transition-all duration-200
                  "
                >
                  Get Started Free

                  <FiArrowRight
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                    size={18}
                  />

                </Link>

                <Link
                  to="/login"
                  className="
                    inline-flex items-center justify-center
                    px-7 py-3.5
                    rounded-xl
                    bg-white
                    dark:bg-dark-card
                    text-gray-900
                    dark:text-white
                    font-semibold
                    border border-gray-200
                    dark:border-gray-700
                    shadow-sm
                    hover:bg-gray-50
                    dark:hover:bg-gray-800
                    transition-all duration-200
                  "
                >
                  Sign In
                </Link>

              </div>

            </motion.div>

          </div>

          {/* Dashboard Preview */}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
            }}
            className="mt-16 lg:mt-20"
          >

            <div className="relative max-w-5xl mx-auto">

              <div className="
                absolute
                -inset-4
                bg-primary/10
                rounded-3xl
                blur-2xl
              " />

              <div className="
                relative
                rounded-2xl
                p-1.5
                bg-gradient-to-br
                from-primary
                to-primary-dark
                shadow-2xl
              ">

                <div className="
                  rounded-xl
                  overflow-hidden
                  bg-gray-100
                  dark:bg-gray-800
                  border
                  border-white/20
                ">

                  <img
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&h=700&fit=crop"
                    alt="InvoiceFlow dashboard preview"
                    className="w-full h-auto opacity-95"
                  />

                </div>

              </div>

            </div>

          </motion.div>

        </div>

      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section
        id="features"
        className="py-20 lg:py-24 bg-gray-50 dark:bg-gray-900/50"
      >

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-14">

            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Features
            </span>

            <h2 className="
              mt-3
              text-3xl
              md:text-4xl
              font-bold
              text-gray-900
              dark:text-white
            ">
              Everything you need to manage your business
            </h2>

            <p className="
              mt-4
              text-lg
              text-gray-600
              dark:text-gray-400
            ">
              Powerful tools designed to make invoicing and business
              management simple.
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {features.map((feature, index) => {

              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08,
                  }}
                  viewport={{
                    once: true,
                  }}
                >

                  <div className="
                    h-full
                    p-7
                    rounded-2xl
                    bg-white
                    dark:bg-dark-card
                    border
                    border-gray-200
                    dark:border-gray-800
                    shadow-sm
                    hover:shadow-lg
                    hover:-translate-y-1
                    transition-all duration-300
                  ">

                    <div className="
                      w-12 h-12
                      rounded-xl
                      bg-primary/10
                      flex items-center justify-center
                      mb-5
                    ">

                      <Icon
                        className="text-primary"
                        size={24}
                      />

                    </div>

                    <h3 className="
                      text-lg
                      font-semibold
                      text-gray-900
                      dark:text-white
                      mb-2
                    ">
                      {feature.title}
                    </h3>

                    <p className="
                      text-gray-600
                      dark:text-gray-400
                      leading-relaxed
                    ">
                      {feature.description}
                    </p>

                  </div>

                </motion.div>
              );
            })}

          </div>

        </div>

      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section className="py-20 lg:py-24">

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-14">

            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              How it works
            </span>

            <h2 className="
              mt-3
              text-3xl
              md:text-4xl
              font-bold
              text-gray-900
              dark:text-white
            ">
              Start managing invoices in minutes
            </h2>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {[
              {
                number: '01',
                title: 'Add your clients',
                description:
                  'Create and organize your client profiles with all the information you need.',
              },
              {
                number: '02',
                title: 'Create an invoice',
                description:
                  'Add products, quantities, prices, taxes, and other invoice details.',
              },
              {
                number: '03',
                title: 'Track your business',
                description:
                  'Monitor invoices and payments from your centralized dashboard.',
              },
            ].map((step, index) => (

              <motion.div
                key={step.number}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{
                  once: true,
                }}
                className="text-center"
              >

                <div className="
                  w-14 h-14
                  mx-auto
                  rounded-2xl
                  bg-primary
                  text-white
                  flex items-center justify-center
                  text-lg
                  font-bold
                  shadow-lg shadow-primary/20
                  mb-5
                ">
                  {step.number}
                </div>

                <h3 className="
                  text-xl
                  font-semibold
                  text-gray-900
                  dark:text-white
                  mb-3
                ">
                  {step.title}
                </h3>

                <p className="
                  text-gray-600
                  dark:text-gray-400
                  leading-relaxed
                ">
                  {step.description}
                </p>

              </motion.div>

            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          TESTIMONIALS
      ===================================================== */}

      <section
        id="testimonials"
        className="py-20 lg:py-24 bg-gray-50 dark:bg-gray-900/50"
      >

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-14">

            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Testimonials
            </span>

            <h2 className="
              mt-3
              text-3xl
              md:text-4xl
              font-bold
              text-gray-900
              dark:text-white
            ">
              Built to make business easier
            </h2>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {testimonials.map((testimonial, index) => (

              <motion.div
                key={testimonial.name}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{
                  once: true,
                }}
              >

                <div className="
                  h-full
                  p-7
                  rounded-2xl
                  bg-white
                  dark:bg-dark-card
                  border
                  border-gray-200
                  dark:border-gray-800
                  shadow-sm
                ">

                  <div className="flex items-center gap-1 mb-5">

                    {[...Array(5)].map((_, i) => (

                      <FiStar
                        key={i}
                        className="text-yellow-400 fill-yellow-400"
                        size={16}
                      />

                    ))}

                  </div>

                  <p className="
                    text-gray-600
                    dark:text-gray-400
                    leading-relaxed
                    mb-7
                  ">
                    "{testimonial.content}"
                  </p>

                  <div className="flex items-center gap-3">

                    <Avatar
                      name={testimonial.avatar}
                      size="md"
                    />

                    <div>

                      <p className="
                        font-semibold
                        text-gray-900
                        dark:text-white
                      ">
                        {testimonial.name}
                      </p>

                      <p className="
                        text-sm
                        text-gray-500
                        dark:text-gray-400
                      ">
                        {testimonial.role}, {testimonial.company}
                      </p>

                    </div>

                  </div>

                </div>

              </motion.div>

            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          FAQ
      ===================================================== */}

      <section
        id="faq"
        className="py-20 lg:py-24"
      >

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-14">

            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              FAQ
            </span>

            <h2 className="
              mt-3
              text-3xl
              md:text-4xl
              font-bold
              text-gray-900
              dark:text-white
            ">
              Frequently asked questions
            </h2>

            <p className="
              mt-4
              text-lg
              text-gray-600
              dark:text-gray-400
            ">
              Everything you need to know about InvoiceFlow.
            </p>

          </div>

          <div className="space-y-3">

            {faqs.map((faq, index) => (

              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />

            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section className="relative overflow-hidden py-20 lg:py-24 bg-primary">

        <div className="
          absolute
          -top-32
          -right-32
          w-96
          h-96
          bg-white/10
          rounded-full
          blur-3xl
        " />

        <div className="
          absolute
          -bottom-32
          -left-32
          w-96
          h-96
          bg-black/10
          rounded-full
          blur-3xl
        " />

        <div className="
          relative
          max-w-4xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          text-center
        ">

          <h2 className="
            text-3xl
            md:text-4xl
            font-bold
            text-white
            mb-5
          ">
            Start organizing your invoices,
            <br className="hidden sm:block" />
            clients, and products with InvoiceFlow.
          </h2>

          <p className="
            text-lg
            md:text-xl
            text-white/80
            max-w-2xl
            mx-auto
            mb-9
          ">
            Everything you need to simplify your invoicing
            workflow and keep your business organized.
          </p>

          {/* FIXED CTA BUTTONS */}

          <div className="
            flex
            flex-col
            sm:flex-row
            items-center
            justify-center
            gap-4
          ">

            {/* Start Free Trial */}

            <Link
              to="/register"
              className="
                inline-flex
                items-center
                justify-center
                px-8
                py-3.5
                rounded-xl
                bg-white
                text-primary
                font-semibold
                shadow-lg
                hover:bg-gray-100
                hover:shadow-xl
                hover:-translate-y-0.5
                transition-all duration-200
              "
            >
              Start Free Trial

              <FiArrowRight
                className="ml-2"
                size={18}
              />

            </Link>

            {/* Sign In */}

            <Link
              to="/login"
              className="
                inline-flex
                items-center
                justify-center
                px-8
                py-3.5
                rounded-xl
                bg-transparent
                text-white
                font-semibold
                border
                border-white/50
                hover:bg-white/10
                hover:border-white
                transition-all duration-200
              "
            >
              Sign In
            </Link>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-gray-950 py-12">

        <div className="
          max-w-7xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
        ">

          <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-10
            mb-10
          ">

            {/* Brand */}

            <div>

              <Link
                to="/"
                className="flex items-center gap-2.5 mb-4"
              >

                <div className="
                  w-9
                  h-9
                  rounded-xl
                  bg-primary
                  flex
                  items-center
                  justify-center
                ">
                  <FiFileText
                    className="text-white"
                    size={19}
                  />
                </div>

                <span className="
                  text-xl
                  font-bold
                  text-white
                ">
                  InvoiceFlow
                </span>

              </Link>

              <p className="
                text-gray-400
                text-sm
                leading-relaxed
                max-w-xs
              ">
                Professional invoicing and business management
                made simple.
              </p>

            </div>

            {/* Product */}

            <div>

              <h4 className="font-semibold text-white mb-4">
                Product
              </h4>

              <ul className="space-y-3">

                <li>
                  <a
                    href="#features"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>

                <li>
                  <a
                    href="#testimonials"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Testimonials
                  </a>
                </li>

                <li>
                  <a
                    href="#faq"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    FAQ
                  </a>
                </li>

              </ul>

            </div>

            {/* Company */}

            <div>

              <h4 className="font-semibold text-white mb-4">
                Company
              </h4>

              <ul className="space-y-3">

                <li>
                  <span className="text-sm text-gray-400">
                    About
                  </span>
                </li>

                <li>
                  <span className="text-sm text-gray-400">
                    Contact
                  </span>
                </li>

                <li>
                  <span className="text-sm text-gray-400">
                    Documentation
                  </span>
                </li>

              </ul>

            </div>

            {/* Support */}

            <div>

              <h4 className="font-semibold text-white mb-4">
                Support
              </h4>

              <ul className="space-y-3">

                <li>
                  <span className="text-sm text-gray-400">
                    Help Center
                  </span>
                </li>

                <li>
                  <span className="text-sm text-gray-400">
                    Privacy
                  </span>
                </li>

                <li>
                  <span className="text-sm text-gray-400">
                    Terms
                  </span>
                </li>

              </ul>

            </div>

          </div>

          {/* Footer Bottom */}

          <div className="
            border-t
            border-gray-800
            pt-7
            flex
            flex-col
            md:flex-row
            items-center
            justify-between
            gap-4
          ">

            <p className="text-gray-500 text-sm">
              © 2026 InvoiceFlow. All rights reserved.
            </p>

            <div className="flex items-center gap-5">

              <a
                href="mailto:support@invoiceflow.com"
                className="
                  text-gray-500
                  hover:text-white
                  transition-colors
                "
                aria-label="Email"
              >
                <FiMail size={19} />
              </a>

              <a
                href="tel:+10000000000"
                className="
                  text-gray-500
                  hover:text-white
                  transition-colors
                "
                aria-label="Phone"
              >
                <FiPhone size={19} />
              </a>

            </div>

          </div>

        </div>

      </footer>

    </div>
  );
};


// =========================================================
// FAQ ITEM
// =========================================================

const FAQItem = ({ question, answer }) => {

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="
      border
      border-gray-200
      dark:border-gray-800
      rounded-2xl
      overflow-hidden
      bg-white
      dark:bg-dark-card
    ">

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full
          flex
          items-center
          justify-between
          px-5
          sm:px-6
          py-5
          text-left
          hover:bg-gray-50
          dark:hover:bg-gray-800/60
          transition-colors
        "
      >

        <span className="
          font-semibold
          text-gray-900
          dark:text-white
          pr-6
        ">
          {question}
        </span>

        <motion.div
          animate={{
            rotate: isOpen ? 180 : 0,
          }}
          transition={{
            duration: 0.2,
          }}
          className="flex-shrink-0"
        >
          <FiChevronDown
            className="text-gray-400"
            size={20}
          />
        </motion.div>

      </button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          duration: 0.25,
        }}
        className="overflow-hidden"
      >

        <div className="
          px-5
          sm:px-6
          pb-5
          text-gray-600
          dark:text-gray-400
          leading-relaxed
        ">
          {answer}
        </div>

      </motion.div>

    </div>
  );
};


export default LandingPage;