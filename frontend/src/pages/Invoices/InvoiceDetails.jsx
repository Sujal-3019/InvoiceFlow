import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiEdit2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiCalendar,
  FiUser,
  FiCreditCard,
  FiGlobe,
  FiHash,
} from "react-icons/fi";

import { api } from "../../utils/axiosInstance";
import { useProfile } from "../../context/ProfileContext";
import { useToast } from "../../context/ToastContext";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import Products from "../Products/Products";

/* =========================================================
   API URL
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

/* =========================================================
   IMAGE / LOGO URL HELPER
========================================================= */

const getAssetUrl = (value) => {
  if (!value) return null;

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  return `${API_URL}${value.startsWith("/") ? "" : "/"}${value}`;
};

/* =========================================================
   SAFE VALUE HELPERS
========================================================= */

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return "";
};

const numberValue = (...values) => {
  for (const value of values) {
    const number = Number(value);

    if (!Number.isNaN(number)) {
      return number;
    }
  }

  return 0;
};

/* =========================================================
   DATE FORMAT
========================================================= */

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* =========================================================
   CURRENCY
========================================================= */

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  SGD: "S$",
  AED: "د.إ",
  SAR: "﷼",
  JPY: "¥",
  CNY: "¥",
};

const formatCurrency = (amount, currency = "INR") => {
  const value = Number(amount) || 0;
  const code = String(currency || "INR").toUpperCase();

  const symbol = CURRENCY_SYMBOLS[code];

  if (symbol) {
    return `${symbol}${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Fallback for currencies not defined above
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
};

/* =========================================================
   NORMALIZE CLIENT
========================================================= */

const normalizeClient = (invoice) => {
  const client =
    invoice?.client ||
    invoice?.customer ||
    invoice?.client_details ||
    invoice?.customer_details ||
    {};

  return {
    id: firstValue(
      client.id,
      invoice.client_id,
      invoice.customer_id
    ),

    name: firstValue(
      client.company_name,
      client.companyName,
      client.name,
      invoice.client_name,
      invoice.customer_name
    ),

    contactPerson: firstValue(
      client.contact_person,
      client.contactPerson,
      invoice.client_contact_person
    ),

    email: firstValue(
      client.email,
      invoice.client_email,
      invoice.customer_email
    ),

    phone: firstValue(
      client.phone,
      invoice.client_phone,
      invoice.customer_phone
    ),

    gstNumber: firstValue(
      client.gst_number,
      client.gstNumber,
      invoice.client_gst_number,
      invoice.gst_number
    ),

    address: firstValue(
      client.address,
      invoice.client_address,
      invoice.customer_address
    ),

    city: firstValue(
      client.city,
      invoice.client_city
    ),

    state: firstValue(
      client.state,
      invoice.client_state
    ),

    zip: firstValue(
      client.zip,
      client.postal_code,
      client.postalCode,
      invoice.client_zip
    ),

    country: firstValue(
      client.country,
      invoice.client_country
    ),
  };
};

/* =========================================================
   NORMALIZE BUSINESS / SELLER SNAPSHOT
========================================================= */

const normalizeBusiness = (invoice, profile) => {
  /*
   * IMPORTANT:
   *
   * We intentionally prefer information stored on the invoice.
   *
   * This means that changing Profile later will NOT change
   * already-created invoices.
   *
   * For older invoices which don't have snapshots, we fall
   * back to the current profile.
   */

  const seller =
    invoice?.seller_snapshot ||
    invoice?.business_snapshot ||
    invoice?.profile_snapshot ||
    invoice?.company_snapshot ||
    invoice?.seller ||
    invoice?.business ||
    {};

  return {
    name: firstValue(
      seller.name,
      seller.business_name,
      seller.businessName,
      seller.company,
      invoice.business_name,
      invoice.businessName,
      invoice.company_name,
      profile?.businessName,
      profile?.company,
      profile?.name
    ),

    ownerName: firstValue(
      seller.owner_name,
      seller.ownerName,
      seller.name,
      invoice.owner_name,
      profile?.name
    ),

    email: firstValue(
      seller.email,
      invoice.business_email,
      invoice.company_email,
      profile?.email
    ),

    phone: firstValue(
      seller.phone,
      invoice.business_phone,
      invoice.company_phone,
      profile?.phone
    ),

    website: firstValue(
      seller.website,
      invoice.business_website,
      profile?.website
    ),

    address: firstValue(
      seller.address,
      invoice.business_address,
      profile?.address
    ),

    city: firstValue(
      seller.city,
      invoice.business_city,
      profile?.city
    ),

    state: firstValue(
      seller.state,
      invoice.business_state,
      profile?.state
    ),

    zip: firstValue(
      seller.zip,
      seller.postal_code,
      seller.postalCode,
      invoice.business_zip,
      profile?.zip,
      profile?.postalCode
    ),

    country: firstValue(
      seller.country,
      invoice.business_country,
      profile?.country
    ),

    taxId: firstValue(
      seller.tax_id,
      seller.taxId,
      invoice.tax_id,
      profile?.taxId
    ),

    gstNumber: firstValue(
      seller.gst_number,
      seller.gstNumber,
      invoice.gst_number,
      profile?.gstNumber
    ),

    panNumber: firstValue(
      seller.pan_number,
      seller.panNumber,
      invoice.pan_number,
      profile?.panNumber
    ),

    registrationNumber: firstValue(
      seller.registration_number,
      seller.registrationNumber,
      invoice.registration_number,
      profile?.registrationNumber
    ),

    /*
     * MOST IMPORTANT FIELD:
     *
     * Prefer historical invoice logo snapshot.
     */
    logo: firstValue(
      invoice.logo_snapshot,
      invoice.logoSnapshot,
      invoice.logo_url_snapshot,
      invoice.logoUrlSnapshot,
      seller.logo_snapshot,
      seller.logo_url,
      seller.logoUrl,
      seller.logo,
      invoice.logo_url,
      invoice.logoUrl,

      /*
       * Last-resort fallback for old invoices.
       */
      profile?.logo,
      profile?.logoUrl,
      profile?.logo_url
    ),
  };
};

/* =========================================================
   NORMALIZE LINE ITEMS
========================================================= */

const normalizeItems = (invoice) => {
  const rawItems =
    invoice?.items ||
    invoice?.line_items ||
    invoice?.lineItems ||
    invoice?.invoice_items ||
    [];

  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems.map((item, index) => {
    const quantity = numberValue(
      item.quantity,
      item.qty,
      1
    );

    const unitPrice = numberValue(
      item.unit_price,
      item.unitPrice,
      item.rate,
      item.price,
      0
    );

    const amount = numberValue(
      item.amount,
      item.total,
      item.line_total,
      item.lineTotal,
      quantity * unitPrice
    );

    const taxRate = numberValue(
      item?.gst_percent,
      item.tax_rate,
      item.taxRate,
      item.tax_percentage,
      item.taxPercentage,
      0
    );

    const taxAmount = numberValue(
      item.tax_amount,
      item.taxAmount,
      (amount * taxRate) / 100
    );

    return {
      id: item.id || index,

      description: firstValue(
        item.name,
        item.description,
        item.item_name,
        item.title,
        "Item"
      ),

      quantity,

      unitPrice,

      taxRate,

      taxAmount,

      amount,
    };
  });
};

/* =========================================================
   NORMALIZE INVOICE
========================================================= */

const normalizeInvoice = (invoice, profile) => {
  const currency = firstValue(
    invoice?.currency,
    invoice?.invoice_currency,
    "INR"
  );

  const items = normalizeItems(invoice);

  const calculatedSubtotal = items.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const calculatedTax = items.reduce(
    (sum, item) => sum + item.taxAmount,
    0
  );

  const subtotal = numberValue(
    invoice?.subtotal,
    invoice?.sub_total,
    calculatedSubtotal
  );

  const tax = numberValue(
    invoice?.tax,
    invoice?.tax_amount,
    invoice?.total_tax,
    calculatedTax
  );

  const discount = numberValue(
    invoice?.discount,
    invoice?.discount_amount,
    0
  );

  const shipping = numberValue(
    invoice?.shipping,
    invoice?.shipping_amount,
    0
  );

  const total = numberValue(
    invoice?.total,
    invoice?.grand_total,
    invoice?.amount,
    subtotal + tax + shipping - discount
  );
  const amountPaid = numberValue(
    invoice?.amount_paid,
    invoice?.amountPaid,
    0
  );

  const amountLeftToPay = Math.max(
    0,
    total - amountPaid
  );

  return {
    id: invoice?.id,

    invoiceNumber: firstValue(
      invoice?.invoice_number,
      invoice?.invoiceNumber,
      invoice?.number,
      invoice?.invoice_no,
      `INV-${invoice?.id || ""}`
    ),

    issueDate: firstValue(
      invoice?.issue_date,
      invoice?.issueDate,
      invoice?.invoice_date,
      invoice?.created_at
    ),

    dueDate: firstValue(
      invoice?.due_date,
      invoice?.dueDate,
    ),

    status: firstValue(
      invoice?.status,
      "draft"
    ),

    currency,

    paymentTerms: firstValue(
      invoice?.payment_terms,
      invoice?.paymentTerms
    ),

    notes: firstValue(
      invoice?.notes,
      invoice?.invoice_notes
    ),

    terms: firstValue(
      invoice?.terms,
      invoice?.invoice_terms
    ),

    reference: firstValue(
      invoice?.reference,
      invoice?.reference_number
    ),

    poNumber: firstValue(
      invoice?.po_number,
      invoice?.poNumber
    ),

    subtotal,
    tax,
    discount,
    shipping,
    total,

    // Payment information
    amountPaid,
    amountLeftToPay,

    items,

    client: normalizeClient(invoice),

    hasSellerSnapshot: Boolean(
      invoice?.seller_snapshot ||
      invoice?.business_snapshot ||
      invoice?.profile_snapshot ||
      invoice?.company_snapshot
    ),

    raw: invoice,
  };
};

/* =========================================================
   STATUS BADGE
========================================================= */

const getStatusVariant = (status) => {
  switch ((status || "").toLowerCase()) {
    case "paid":
      return "success";

    case "sent":
      return "info";

    case "overdue":
      return "danger";

    case "cancelled":
    case "canceled":
      return "danger";

    case "draft":
    default:
      return "neutral";
  }
};

const getPaymentStatus = (invoice) => {
  const total = Number(invoice?.total) || 0;
  const amountPaid = Number(invoice?.amountPaid) || 0;
  const amountLeftToPay = Math.max(0, total - amountPaid);

  if (total <= 0) {
    return {
      label: "Unpaid",
      variant: "neutral",
      color: "text-gray-600",
      bg: "bg-gray-100",
    };
  }

  // Fully paid
  if (amountPaid >= total) {
    return {
      label: "Paid",
      variant: "success",
      color: "text-green-700",
      bg: "bg-green-50",
    };
  }

  // Partially paid
  if (amountPaid > 0) {
    return {
      label: "Partially Paid",
      variant: "warning",
      color: "text-yellow-700",
      bg: "bg-yellow-50",
    };
  }

  // Check due date
  if (invoice?.dueDate) {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);

    // Remove time from both dates
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today && amountLeftToPay > 0) {
      return {
        label: "Overdue",
        variant: "danger",
        color: "text-red-700",
        bg: "bg-red-50",
      };
    }
  }

  return {
    label: "Unpaid",
    variant: "danger",
    color: "text-red-700",
    bg: "bg-red-50",
  };
};

/* =========================================================
   ADDRESS BUILDER
========================================================= */

const buildAddress = (data) => {
  if (!data) return "";

  return [
    data.address,
    data.city,
    data.state,
    data.zip,
    data.country,
  ]
    .filter(Boolean)
    .join(", ");
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const InvoiceDetails = () => {
  const navigate = useNavigate();
  const { id: invoiceId } = useParams();

  const { profile } = useProfile();
  const { success, error } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [business, setBusiness] = useState(null);
  const [client, setClient] = useState(null);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  /* =======================================================
     FETCH INVOICE
  ======================================================= */

  useEffect(() => {
    if (!invoiceId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const loadInvoice = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        /*
         * Expected API:
         *
         * api.invoices.get(invoiceId)
         *
         * This should return the complete saved invoice.
         */
        const response = await api.invoices.get(invoiceId);

        const rawInvoice =
          response?.data?.invoice ||
          response?.data;

        if (!rawInvoice) {
          setNotFound(true);
          return;
        }

        const normalized = normalizeInvoice(rawInvoice, profile);

        const normalizedBusiness = normalizeBusiness(
          rawInvoice,
          profile
        );

        setInvoice(normalized);
        setBusiness(normalizedBusiness);
        setClient(normalized.client);

        /*
         * If invoice does not contain client snapshot,
         * fetch the real client record.
         */
        if (
          normalized.client.id &&
          (
            !normalized.client.name ||
            !normalized.client.email
          )
        ) {
          try {
            const clientResponse =
              await api.clients.get(normalized.client.id);

            const realClient =
              clientResponse?.data?.client ||
              clientResponse?.data;

            if (realClient) {
              const mergedClient = {
                ...normalized.client,

                id:
                  realClient.id ||
                  normalized.client.id,

                name:
                  realClient.company_name ||
                  realClient.companyName ||
                  realClient.name ||
                  normalized.client.name,

                contactPerson:
                  realClient.contact_person ||
                  realClient.contactPerson ||
                  normalized.client.contactPerson,

                email:
                  realClient.email ||
                  normalized.client.email,

                phone:
                  realClient.phone ||
                  normalized.client.phone,

                gstNumber:
                  realClient.gst_number ||
                  realClient.gstNumber ||
                  normalized.client.gstNumber,

                address:
                  realClient.address ||
                  normalized.client.address,

                city:
                  realClient.city ||
                  normalized.client.city,

                state:
                  realClient.state ||
                  normalized.client.state,

                zip:
                  realClient.zip ||
                  realClient.postal_code ||
                  normalized.client.zip,

                country:
                  realClient.country ||
                  normalized.client.country,
              };

              setClient(mergedClient);
            }
          } catch (clientError) {
            /*
             * Client lookup should not prevent an invoice
             * from being displayed.
             */
            console.warn(
              "Unable to load client details:",
              clientError
            );
          }
        }
      } catch (err) {
        console.error(
          "FAILED TO LOAD INVOICE:",
          err
        );

        console.error(
          "INVOICE RESPONSE:",
          err?.response
        );

        console.error(
          "INVOICE RESPONSE DATA:",
          err?.response?.data
        );

        if (err?.response?.status === 404) {
          setNotFound(true);
        }

        error(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to load invoice"
        );
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceId, profile]);

  /* =======================================================
     PRINT
  ======================================================= */

  const handlePrint = () => {
    window.print();
  };

  /* =======================================================
     DOWNLOAD / PDF
  ======================================================= */

  const handleDownload = async () => {
    try {
      // --------------------------------------------------
      // STEP 1: Generate the PDF
      // --------------------------------------------------
      await api.post(`/invoices/${invoice.id}/pdf`);

      // --------------------------------------------------
      // STEP 2: Download the generated PDF
      // --------------------------------------------------
      const response = await api.get(
        `/invoices/${invoice.id}/pdf`,
        {
          responseType: "blob",
        }
      );

      // --------------------------------------------------
      // STEP 3: Create browser download
      // --------------------------------------------------
      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        `invoice_${invoice.invoiceNumber}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(
        "Unable to download invoice:",
        error
      );

      alert(
        error?.response?.data?.detail ||
        "Unable to download invoice."
      );
    }
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const handleEdit = () => {
    navigate(
      `/invoices/${invoiceId}/edit`,
      {
        state: {
          invoice: invoice?.raw,
        },
      }
    );
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />

          <p className="text-sm text-gray-500">
            Loading invoice...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (notFound || !invoice) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center">
            <FiFileText size={28} />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Invoice not found
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            The invoice you are trying to view could not
            be found.
          </p>

          <div className="mt-6">
            <Button
              onClick={() => navigate("/invoices")}
              leftIcon={<FiArrowLeft />}
            >
              Back to Invoices
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  /* =======================================================
     CALCULATED DATA
  ======================================================= */

  const businessAddress =
    buildAddress(business);

  const clientAddress =
    buildAddress(client);

  const logoUrl =
    getAssetUrl(business?.logo);

  const hasLogo = Boolean(logoUrl);

  const subtotal = invoice.subtotal;
  const tax = invoice.tax;
  const discount = invoice.discount;
  const shipping = invoice.shipping;
  const total = invoice.total;
  const paymentStatus = getPaymentStatus(invoice);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6 pb-12">

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>

          <div>
            <div className="flex items-center gap-3">

              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {invoice.invoiceNumber}
              </h1>

              <Badge
                variant={getStatusVariant(
                  invoice.status
                )}
              >
                {invoice.status}
              </Badge>

            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View invoice details
            </p>
          </div>

        </div>

        <div className="flex flex-wrap gap-2">

          <Button
            variant="secondary"
            onClick={handlePrint}
            leftIcon={<FiPrinter />}
          >
            Print
          </Button>

          <Button
            variant="secondary"
            onClick={handleDownload}
            leftIcon={<FiDownload />}
          >
            Download
          </Button>

          <Button
            onClick={handleEdit}
            leftIcon={<FiEdit2 />}
          >
            Edit Invoice
          </Button>

        </div>

      </div>


      {/* ===================================================
          INVOICE DOCUMENT
      =================================================== */}

      <div
        id="invoice-document"
        className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden print:shadow-none print:border-0 print:rounded-none"
      >

        {/* =================================================
            INVOICE HEADER
        ================================================= */}

        <div className="p-6 md:p-10">

          <div className="flex flex-col md:flex-row md:justify-between gap-8">

            {/* BUSINESS */}

            <div className="flex items-start gap-4">

              {hasLogo ? (
                <div className="w-24 h-24 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0">

                  <img
                    src={logoUrl}
                    alt={`${business?.name || "Business"} logo`}
                    className="max-w-full max-h-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />

                </div>
              ) : (
                <Avatar
                  name={
                    business?.name ||
                    "Business"
                  }
                  size="2xl"
                  className="w-24 h-24 shrink-0"
                />
              )}

              <div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {business?.name ||
                    "Your Business"}
                </h2>

                {business?.ownerName &&
                  business.ownerName !==
                  business.name && (
                    <p className="text-sm text-gray-500 mt-1">
                      {business.ownerName}
                    </p>
                  )}

                {businessAddress && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-md">
                    {businessAddress}
                  </p>
                )}

                <div className="mt-2 space-y-1">

                  {business?.email && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <FiMail size={14} />
                      {business.email}
                    </p>
                  )}

                  {business?.phone && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <FiPhone size={14} />
                      {business.phone}
                    </p>
                  )}

                  {business?.website && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <FiGlobe size={14} />
                      {business.website}
                    </p>
                  )}

                </div>

              </div>

            </div>


            {/* INVOICE INFORMATION */}

            <div className="md:text-right">

              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Invoice
              </p>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {invoice.invoiceNumber}
              </h1>

              <div className="mt-5 space-y-2">

                <div className="flex md:justify-end items-center gap-3 text-sm">

                  <span className="text-gray-500">
                    Issue Date
                  </span>

                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(
                      invoice.issueDate
                    )}
                  </span>

                </div>

                {invoice.dueDate && (
                  <div className="flex md:justify-end items-center gap-3 text-sm">

                    <span className="text-gray-500">
                      Due Date
                    </span>

                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(
                        invoice.dueDate
                      )}
                    </span>

                  </div>
                )}

                {invoice.paymentTerms && (
                  <div className="flex md:justify-end items-center gap-3 text-sm">

                    <span className="text-gray-500">
                      Payment Terms
                    </span>

                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {invoice.paymentTerms}
                    </span>

                  </div>
                )}

                {invoice.reference && (
                  <div className="flex md:justify-end items-center gap-3 text-sm">

                    <span className="text-gray-500">
                      Reference
                    </span>

                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {invoice.reference}
                    </span>

                  </div>
                )}

                {invoice.poNumber && (
                  <div className="flex md:justify-end items-center gap-3 text-sm">

                    <span className="text-gray-500">
                      PO Number
                    </span>

                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {invoice.poNumber}
                    </span>

                  </div>
                )}

              </div>

            </div>

          </div>


          {/* =================================================
              SELLER TAX INFORMATION
          ================================================= */}

          {(business?.taxId ||
            business?.gstNumber ||
            business?.panNumber ||
            business?.registrationNumber) && (

              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">

                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">

                  {business?.taxId && (
                    <div>
                      <span className="text-gray-500">
                        Tax ID:
                      </span>{" "}
                      <span className="font-medium">
                        {business.taxId}
                      </span>
                    </div>
                  )}

                  {business?.gstNumber && (
                    <div>
                      <span className="text-gray-500">
                        GST:
                      </span>{" "}
                      <span className="font-medium">
                        {business.gstNumber}
                      </span>
                    </div>
                  )}

                  {business?.panNumber && (
                    <div>
                      <span className="text-gray-500">
                        PAN:
                      </span>{" "}
                      <span className="font-medium">
                        {business.panNumber}
                      </span>
                    </div>
                  )}

                  {business?.registrationNumber && (
                    <div>
                      <span className="text-gray-500">
                        Registration:
                      </span>{" "}
                      <span className="font-medium">
                        {business.registrationNumber}
                      </span>
                    </div>
                  )}

                </div>

              </div>
            )}


          {/* =================================================
              BILL TO
          ================================================= */}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-5">

              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                <FiUser size={14} />
                Bill To
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {client?.name ||
                  "Client"}
              </h3>

              {client?.contactPerson && (
                <p className="text-sm text-gray-500 mt-1">
                  {client.contactPerson}
                </p>
              )}

              {clientAddress && (
                <p className="text-sm text-gray-500 mt-3">
                  {clientAddress}
                </p>
              )}

              <div className="mt-3 space-y-1">

                {client?.email && (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FiMail size={14} />
                    {client.email}
                  </p>
                )}

                {client?.phone && (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <FiPhone size={14} />
                    {client.phone}
                  </p>
                )}

                {client?.gstNumber && (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    GST: {client.gstNumber}
                  </p>
                )}

              </div>

            </div>


            <div className="rounded-xl bg-primary/5 p-5">

              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                <FiCalendar size={14} />
                Invoice Summary
              </div>

              <div className="space-y-3">

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">
                    Invoice Number
                  </span>

                  <span className="font-medium">
                    {invoice.invoiceNumber}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">
                    Issue Date
                  </span>

                  <span className="font-medium">
                    {formatDate(
                      invoice.issueDate
                    )}
                  </span>
                </div>

                {invoice.dueDate && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-gray-500">
                      Due Date
                    </span>

                    <span className="font-medium">
                      {formatDate(
                        invoice.dueDate
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">
                    Currency
                  </span>

                  <span className="font-medium">
                    {invoice.currency}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">
                    Status
                  </span>

                  <Badge
                    variant={getStatusVariant(
                      invoice.status
                    )}
                  >
                    {invoice.status}
                  </Badge>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">
                    Payment Status
                  </span>

                  <Badge variant={paymentStatus.variant}>
                    {paymentStatus.label}
                  </Badge>
                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              ITEMS
          ================================================= */}

          <div className="mt-8 overflow-x-auto">

            <table className="w-full min-w-[700px]">

              <thead>

                <tr className="border-y border-gray-200 dark:border-gray-700">

                  <th className="text-left py-4 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    S.No.
                  </th>

                  <th className="text-left py-4 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Description
                  </th>

                  <th className="text-right py-4 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Qty
                  </th>

                  <th className="text-right py-4 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rate
                  </th>

                  <th className="text-right py-4 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tax
                  </th>

                  <th className="text-right py-4 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>

                </tr>

              </thead>

              <tbody>

                {invoice.items.length > 0 ? (
                  invoice.items.map(
                    (item, index) => (
                      <tr
                        key={item.id || index}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >

                        <td className="py-4 px-3 text-sm text-gray-500">
                          {index + 1}
                        </td>

                        <td className="py-4 px-3">

                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {item.description}
                          </p>

                        </td>

                        <td className="py-4 px-3 text-sm text-right">
                          {item.quantity}
                        </td>

                        <td className="py-4 px-3 text-sm text-right">
                          {formatCurrency(
                            item.unitPrice,
                            invoice.currency
                          )}
                        </td>

                        <td className="py-4 px-3 text-sm text-right">

                          {item.taxRate > 0
                            ? `${item.taxRate}%`
                            : "—"}

                        </td>

                        <td className="py-4 px-3 text-sm text-right font-medium">
                          {formatCurrency(
                            item.amount,
                            invoice.currency
                          )}
                        </td>

                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-12 text-center text-gray-500"
                    >
                      No invoice items found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>


          {/* =================================================
              TOTALS
          ================================================= */}

          <div className="mt-8 flex justify-end">

            <div className="w-full md:w-96 space-y-3">

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-medium">
                  {formatCurrency(
                    subtotal,
                    invoice.currency
                  )}
                </span>
              </div>


              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Discount
                  </span>

                  <span className="font-medium text-green-600">
                    -
                    {formatCurrency(
                      discount,
                      invoice.currency
                    )}
                  </span>
                </div>
              )}


              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Tax
                  </span>

                  <span className="font-medium">
                    {formatCurrency(
                      tax,
                      invoice.currency
                    )}
                  </span>
                </div>
              )}


              {shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Shipping
                  </span>

                  <span className="font-medium">
                    {formatCurrency(
                      shipping,
                      invoice.currency
                    )}
                  </span>
                </div>
              )}


              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-end">

                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Total
                </span>

                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    total,
                    invoice.currency
                  )}
                </span>

              </div>


              {/* AMOUNT PAID */}

              <div className="flex justify-between text-sm pt-2 ">

                <span className="text-gray-500">
                  Amount Paid
                </span>

                <span className="font-medium text-green-600">
                  {formatCurrency(
                    invoice.amountPaid,
                    invoice.currency
                  )}
                </span>

              </div>


              {/* AMOUNT LEFT TO PAY */}

              <div className="flex justify-between text-sm">

                <span className="text-gray-500">
                  Amount Left to Pay
                </span>

                <span className="font-medium text-red-500">
                  {formatCurrency(
                    invoice.amountLeftToPay,
                    invoice.currency
                  )}
                </span>

              </div>
              <div
                className={`mt-4 rounded-xl p-4 ${paymentStatus.bg} text-black`}
              >
                <div className="flex items-center justify-between gap-4 ">

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Payment Status
                    </p>

                    <p className={`mt-1 text-lg font-bold ${paymentStatus.color}`}>
                      {paymentStatus.label}
                    </p>
                  </div>

                  <Badge variant={paymentStatus.variant}>
                    {paymentStatus.label}
                  </Badge>

                </div>

                <div className="mt-3 text-sm text-gray-600">
                  {paymentStatus.label === "Paid" && (
                    <span>
                      This invoice has been fully paid.
                    </span>
                  )}

                  {paymentStatus.label === "Partially Paid" && (
                    <span>
                      {formatCurrency(
                        invoice.amountLeftToPay,
                        invoice.currency
                      )}{" "}
                      remaining to be paid.
                    </span>
                  )}

                  {paymentStatus.label === "Unpaid" && (
                    <span>
                      No payment has been recorded for this invoice.
                    </span>
                  )}
                </div>
              </div>

            </div>

          </div>


          {/* =================================================
              NOTES
          ================================================= */}

          {invoice.notes && (
            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">

              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Notes
              </h3>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">
                {invoice.notes}
              </p>

            </div>
          )}


          {/* =================================================
              TERMS
          ================================================= */}

          {invoice.terms && (
            <div className="mt-6">

              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Terms & Conditions
              </h3>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">
                {invoice.terms}
              </p>

            </div>
          )}


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            <div className="text-xs text-gray-400">
              Thank you for your business.
            </div>

            <div className="text-xs text-gray-400">
              {business?.name || "Business"}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default InvoiceDetails;