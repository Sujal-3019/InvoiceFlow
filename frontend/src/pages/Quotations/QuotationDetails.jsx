import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiEdit2,
  FiCalendar,
  FiUser,
  FiFileText,
  FiHash,
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiTrash2,
} from 'react-icons/fi';

import { api } from '../../utils/axiosInstance';

import {
  Button,
  Card,
  Badge,
  Avatar,
} from '../../components/ui';

import { useToast } from '../../context/ToastContext';


// =========================================================
// HELPERS
// =========================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';


const getAssetUrl = (url) => {
  if (!url) return null;

  if (
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${API_URL}${url}`;
  }

  return `${API_URL}/${url}`;
};


const formatDate = (date) => {
  if (!date) return '—';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
};


const formatCurrency = (
  amount,
  currency = 'INR'
) => {
  const numericAmount = Number(amount || 0);

  try {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
};


const numberValue = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


const buildAddress = (data = {}) => {
  const parts = [
    data.address,
    data.city,
    data.state,
    data.zip,
    data.country,
  ].filter(Boolean);

  return parts.join(', ');
};


// =========================================================
// COMPONENT
// =========================================================

const QuotationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [quotation, setQuotation] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  const [downloading, setDownloading] =
    useState(false);

  const [sendingQuotation, setSendingQuotation] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);
    
  // =======================================================
  // FETCH QUOTATION
  // =======================================================

  const loadQuotation = async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setNotFound(false);

      const response =
        await api.quotations.get(id);

      const data = response?.data;

      if (!data?.id) {
        setNotFound(true);
        return;
      }

      setQuotation(data);
    } catch (error) {
      console.error(
        'Failed to load quotation:',
        error
      );

      setNotFound(true);

      showToast?.(
        error?.response?.data?.detail ||
          'Failed to load quotation.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadQuotation();
  }, [id]);


  // =======================================================
  // CALCULATED VALUES
  // =======================================================

  const currency =
    quotation?.currency || 'INR';

  const items =
    quotation?.items || [];

  const subtotal =
    numberValue(quotation?.subtotal);

  const discount =
    numberValue(quotation?.discount);

  const taxAmount =
    numberValue(quotation?.tax_amount);

  const grandTotal =
    numberValue(quotation?.grand_total);


  const sellerAddress = useMemo(() => {
    return buildAddress(
      quotation?.company || {}
    );
  }, [quotation]);


  const clientAddress = useMemo(() => {
    return buildAddress(
      quotation?.client || {}
    );
  }, [quotation]);


  // =======================================================
  // PRINT
  // =======================================================

  const handlePrint = () => {
    window.print();
  };


  // =======================================================
  // DOWNLOAD PDF
  // =======================================================

  const handleDownload = async () => {
    if (!quotation?.id) return;

    try {
      setDownloading(true);

      /*
       * Generate the latest PDF first.
       *
       * This makes sure the downloaded PDF contains
       * the latest quotation information.
       */

      await api.quotations.generatePdf(
        quotation.id
      );

      const response =
        await api.quotations.downloadPdf(
          quotation.id
        );

      const blob = new Blob(
        [response.data],
        {
          type: 'application/pdf',
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = url;

      link.download =
        quotation.pdf_filename ||
        `Quotation-${
          quotation.quotation_number ||
          quotation.id
        }.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      showToast?.(
        'Quotation downloaded successfully.',
        'success'
      );
    } catch (error) {
      console.error(
        'Failed to download quotation:',
        error
      );

      showToast?.(
        error?.response?.data?.detail ||
          'Failed to download quotation.',
        'error'
      );
    } finally {
      setDownloading(false);
    }
  };


  // =======================================================
  // SEND QUOTATION
  // =======================================================

  const handleSendQuotation = async () => {
  if (
    !quotation?.id ||
    sendingQuotation
  ) {
    return;
  }

  try {
    setSendingQuotation(true);

    const response =
      await api.quotations.send(
        quotation.id
      );

    const recipient =
      response?.data?.recipient ||
      quotation.client?.email;

    success(
      `Quotation ${quotation.quotation_number} sent successfully to ${recipient}.`,
      3000
    );
  } catch (error) {
    console.error(
      'Failed to send quotation:',
      error
    );

    error(
      error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Failed to send quotation.',
      3000
    );
  } finally {
    setSendingQuotation(false);
  }
};

  // =======================================================
  // DELETE QUOTATION
  // =======================================================

  const handleDelete = async () => {
    if (!quotation?.id) return;

    const confirmed =
      window.confirm(
        `Are you sure you want to delete quotation ${quotation.quotation_number}?`
      );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await api.quotations.delete(
        quotation.id
      );

      showToast?.(
        'Quotation deleted successfully.',
        'success'
      );

      navigate('/quotations');
    } catch (error) {
      console.error(
        'Failed to delete quotation:',
        error
      );

      showToast?.(
        error?.response?.data?.detail ||
          'Failed to delete quotation.',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">

          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading quotation...
          </p>

        </div>
      </div>
    );
  }


  // =======================================================
  // NOT FOUND
  // =======================================================

  if (
    notFound ||
    !quotation
  ) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">

        <Card className="max-w-md w-full p-8 text-center">

          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gray-100 dark:bg-dark-card flex items-center justify-center">

            <FiFileText
              size={25}
              className="text-gray-500"
            />

          </div>


          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Quotation not found
          </h2>


          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            The quotation you're looking for doesn't exist
            or you don't have access to it.
          </p>


          <div className="mt-6">

            <Button
              variant="primary"
              onClick={() =>
                navigate('/quotations')
              }
            >
              <FiArrowLeft className="mr-2" />
              Back to Quotations
            </Button>

          </div>

        </Card>

      </div>
    );
  }


  // =======================================================
  // COMPANY / CLIENT
  // =======================================================

  const company =
    quotation.company || {};

  const client =
    quotation.client || {};


  const companyName =
    company.business_name ||
    company.company ||
    'Your Company';


  const clientName =
    client.company_name ||
    client.contact_person ||
    'Client';


  const companyLogo =
    getAssetUrl(
      company.logo_url ||
        quotation.logo_url
    );


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <>

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="mb-6 print:hidden">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                navigate('/quotations')
              }
              className="w-10 h-10 rounded-lg border border-gray-200 dark:border-dark-border flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
              title="Back"
            >
              <FiArrowLeft size={19} />
            </button>


            <div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Quotation Details
              </h1>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                View quotation information and download the PDF
              </p>

            </div>

          </div>


          {/* ACTION BUTTONS */}

          <div className="flex flex-wrap items-center gap-2">

            {/* PRINT */}

            <Button
              variant="secondary"
              onClick={handlePrint}
            >
              <FiPrinter className="mr-2" />
              Print
            </Button>


            {/* DOWNLOAD PDF */}

            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={downloading}
            >
              <FiDownload className="mr-2" />

              {downloading
                ? 'Downloading...'
                : 'Download PDF'}
            </Button>


            {/* SEND QUOTATION */}

            <Button
              variant="secondary"
              onClick={handleSendQuotation}
              disabled={
                sendingQuotation ||
                !quotation.client?.email
              }
            >
              <FiMail className="mr-2" />

              {sendingQuotation
                ? 'Sending...'
                : 'Send Quotation'}
            </Button>


            {/* EDIT */}

            <Button
              variant="secondary"
              onClick={() =>
                navigate(
                  `/quotations/${quotation.id}/edit`
                )
              }
            >
              <FiEdit2 className="mr-2" />
              Edit
            </Button>


            {/* DELETE */}

            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              <FiTrash2 className="mr-2" />

              {deleting
                ? 'Deleting...'
                : 'Delete'}
            </Button>

          </div>

        </div>

      </div>


      {/* ===================================================
          QUOTATION DOCUMENT
      =================================================== */}

      <div
        id="quotation-document"
        className="max-w-5xl mx-auto bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden print:shadow-none print:border-0 print:rounded-none"
      >

        {/* =================================================
            TOP HEADER
        ================================================= */}

        <div className="p-8 md:p-10 border-b border-gray-200 dark:border-dark-border">

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">

            {/* COMPANY */}

            <div className="flex items-start gap-4">

              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={`${companyName} logo`}
                  className="w-16 h-16 object-contain rounded-lg border border-gray-200 dark:border-dark-border"
                />
              ) : (
                <Avatar
                  name={companyName}
                  size="lg"
                />
              )}


              <div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {companyName}
                </h2>


                {company.email && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <FiMail size={14} />
                    <span>
                      {company.email}
                    </span>
                  </div>
                )}


                {company.phone && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <FiPhone size={14} />
                    <span>
                      {company.phone}
                    </span>
                  </div>
                )}


                {company.website && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <FiGlobe size={14} />
                    <span>
                      {company.website}
                    </span>
                  </div>
                )}


                {sellerAddress && (
                  <div className="flex items-start gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">

                    <FiMapPin
                      size={14}
                      className="mt-0.5 shrink-0"
                    />

                    <span>
                      {sellerAddress}
                    </span>

                  </div>
                )}

              </div>

            </div>


            {/* QUOTATION TITLE */}

            <div className="md:text-right">

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                QUOTATION
              </h1>


              <div className="mt-3 inline-flex items-center">

                <Badge variant="info">
                  {quotation.quotation_number}
                </Badge>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            QUOTATION INFORMATION
        ================================================= */}

        <div className="p-8 md:p-10 border-b border-gray-200 dark:border-dark-border">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* BILL TO */}

            <div>

              <div className="flex items-center gap-2 mb-3">

                <FiUser
                  size={17}
                  className="text-primary"
                />

                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Bill To
                </h3>

              </div>


              <div className="rounded-lg border border-gray-200 dark:border-dark-border p-5">

                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {clientName}
                </h4>


                {client.contact_person &&
                  client.company_name && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {client.contact_person}
                    </p>
                  )}


                {client.email && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-600 dark:text-gray-300">
                    <FiMail size={14} />
                    <span>
                      {client.email}
                    </span>
                  </div>
                )}


                {client.phone && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-300">
                    <FiPhone size={14} />
                    <span>
                      {client.phone}
                    </span>
                  </div>
                )}


                {clientAddress && (
                  <div className="flex items-start gap-2 mt-1 text-sm text-gray-600 dark:text-gray-300">

                    <FiMapPin
                      size={14}
                      className="mt-0.5 shrink-0"
                    />

                    <span>
                      {clientAddress}
                    </span>

                  </div>
                )}


                {client.gst_number && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      GST Number
                    </p>

                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {client.gst_number}
                    </p>

                  </div>
                )}

              </div>

            </div>


            {/* QUOTATION INFO */}

            <div>

              <div className="flex items-center gap-2 mb-3">

                <FiFileText
                  size={17}
                  className="text-primary"
                />

                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Quotation Information
                </h3>

              </div>


              <div className="rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">

                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-dark-border">

                  <div className="flex items-center gap-3">

                    <FiHash
                      size={16}
                      className="text-gray-400"
                    />

                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Quotation Number
                    </span>

                  </div>

                  <span className="font-semibold text-gray-900 dark:text-white">
                    {quotation.quotation_number}
                  </span>

                </div>


                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-dark-border">

                  <div className="flex items-center gap-3">

                    <FiCalendar
                      size={16}
                      className="text-gray-400"
                    />

                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Quotation Date
                    </span>

                  </div>

                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(
                      quotation.quotation_date
                    )}
                  </span>

                </div>


                <div className="flex items-center justify-between px-5 py-4">

                  <div className="flex items-center gap-3">

                    <FiCalendar
                      size={16}
                      className="text-gray-400"
                    />

                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Valid Until
                    </span>

                  </div>

                  <span className="font-medium text-gray-900 dark:text-white">
                    {quotation.valid_until
                      ? formatDate(
                          quotation.valid_until
                        )
                      : 'Not specified'}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            ITEMS
        ================================================= */}

        <div className="p-8 md:p-10">

          <div className="flex items-center gap-2 mb-4">

            <FiFileText
              size={17}
              className="text-primary"
            />

            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Quotation Items
            </h3>

          </div>


          <div className="overflow-x-auto border border-gray-200 dark:border-dark-border rounded-lg">

            <table className="w-full min-w-[700px]">

              <thead>

                <tr className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    #
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Item
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Qty
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Unit Price
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    GST
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total
                  </th>

                </tr>

              </thead>


              <tbody>

                {items.length > 0 ? (
                  items.map(
                    (item, index) => {

                      const quantity =
                        numberValue(
                          item.quantity
                        );

                      const unitPrice =
                        numberValue(
                          item.unit_price
                        );

                      const gstPercent =
                        numberValue(
                          item.gst_percent
                        );

                      const lineTotal =
                        numberValue(
                          item.line_total
                        );

                      return (
                        <tr
                          key={
                            item.id ||
                            `${item.product_id}-${index}`
                          }
                          className="border-b last:border-b-0 border-gray-200 dark:border-dark-border"
                        >

                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </td>


                          <td className="px-4 py-4">

                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.name ||
                                item.product_name ||
                                'Item'}
                            </div>

                            {item.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.description}
                              </div>
                            )}

                          </td>


                          <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                            {quantity}
                          </td>


                          <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                            {formatCurrency(
                              unitPrice,
                              currency
                            )}
                          </td>


                          <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                            {gstPercent}%
                          </td>


                          <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(
                              lineTotal,
                              currency
                            )}
                          </td>

                        </tr>
                      );
                    }
                  )
                ) : (
                  <tr>

                    <td
                      colSpan="6"
                      className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No quotation items found.
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

            <div className="w-full sm:w-96">

              <div className="space-y-3">

                {/* SUBTOTAL */}

                <div className="flex items-center justify-between text-sm">

                  <span className="text-gray-500 dark:text-gray-400">
                    Subtotal
                  </span>

                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(
                      subtotal,
                      currency
                    )}
                  </span>

                </div>


                {/* DISCOUNT */}

                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm">

                    <span className="text-gray-500 dark:text-gray-400">
                      Discount
                    </span>

                    <span className="font-medium text-gray-900 dark:text-white">
                      -{' '}
                      {formatCurrency(
                        discount,
                        currency
                      )}
                    </span>

                  </div>
                )}


                {/* TAX */}

                <div className="flex items-center justify-between text-sm">

                  <span className="text-gray-500 dark:text-gray-400">
                    Tax
                  </span>

                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(
                      taxAmount,
                      currency
                    )}
                  </span>

                </div>


                {/* GRAND TOTAL */}

                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-dark-border">

                  <div className="flex items-center justify-between">

                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      Grand Total
                    </span>

                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(
                        grandTotal,
                        currency
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            NOTES & TERMS
        ================================================= */}

        {(quotation.notes ||
          quotation.terms) && (
          <div className="px-8 md:px-10 pb-8 md:pb-10">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* NOTES */}

              {quotation.notes && (
                <div className="rounded-lg bg-gray-50 dark:bg-dark-bg p-5">

                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Notes
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {quotation.notes}
                  </p>

                </div>
              )}


              {/* TERMS */}

              {quotation.terms && (
                <div className="rounded-lg bg-gray-50 dark:bg-dark-bg p-5">

                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Terms & Conditions
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {quotation.terms}
                  </p>

                </div>
              )}

            </div>

          </div>
        )}


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="px-8 md:px-10 py-6 bg-gray-50 dark:bg-dark-bg border-t border-gray-200 dark:border-dark-border text-center">

          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Thank you for considering our services.
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This quotation is subject to the terms and conditions
            mentioned above.
          </p>

        </div>

      </div>


      {/* ===================================================
          PRINT STYLES
      =================================================== */}

      <style>
        {`
          @media print {

            @page {
              size: A4;
              margin: 12mm;
            }

            body {
              background: white !important;
            }

            #quotation-document {
              width: 100%;
              max-width: none;
              margin: 0;
              box-shadow: none !important;
              border: none !important;
            }

            .print\\:hidden {
              display: none !important;
            }

          }
        `}
      </style>

    </>
  );
};


export default QuotationDetails;
