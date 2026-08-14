import { useState, useMemo, useEffect } from 'react';
import {
  Link,
  useNavigate,
  useSearchParams
} from 'react-router-dom';
import { motion } from 'framer-motion';
import React from 'react';
import { api } from '../../utils/axiosInstance';
import {
  FiSearch,
  FiPlus,
  FiFilter,
  FiDownload,
  FiSend,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiEye,
  FiChevronDown
} from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import SearchBar from '../../components/ui/SearchBar';
import { formatCurrency, formatDate } from '../../utils/helper';

const mapInvoice = (invoice, clients = []) => {
  const client = clients.find(
    (client) => String(client.id) === String(invoice.client_id)
  );

  const mappedInvoice = {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    clientId: invoice.client_id,

    client:
      client?.company_name ||
      `Client #${invoice.client_id}`,

    email:
      client?.email || '',

    amount: Number(invoice.grand_total || 0),

    status: invoice.status,
    paymentStatus: invoice.payment_status,

    date: invoice.invoice_date,
    dueDate: invoice.due_date,

    subtotal: Number(invoice.subtotal || 0),
    discount: Number(invoice.discount || 0),
    taxAmount: Number(invoice.tax_amount || 0),

    amountPaid: Number(invoice.amount_paid || 0),
    amountDue: Number(invoice.amount_due || 0),

    notes: invoice.notes,
    items: invoice.items || [],
  };

  return {
    ...mappedInvoice,

    searchText: [
      mappedInvoice.invoiceNumber,
      mappedInvoice.client,
      mappedInvoice.email,
      mappedInvoice.status,
      mappedInvoice.paymentStatus,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  };
};


const AllInvoices = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInvoices();

    const handleInvoiceUpdated = () => {
      fetchInvoices();
    };

    window.addEventListener(
      "invoiceUpdated",
      handleInvoiceUpdated
    );

    return () => {
      window.removeEventListener(
        "invoiceUpdated",
        handleInvoiceUpdated
      );
    };
  }, []);
  useEffect(() => {
    const search = searchParams.get("search") || "";

    setSearchQuery(search);
  }, [searchParams]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const [invoiceResponse, clientResponse] = await Promise.all([
        api.invoices.list(),
        api.clients.list(),
      ]);

      console.log('INVOICES API DATA:', invoiceResponse.data);
      console.log('CLIENTS API DATA:', clientResponse.data);

      const invoiceData = Array.isArray(invoiceResponse.data)
        ? invoiceResponse.data
        : [];

      const clientData = Array.isArray(clientResponse.data)
        ? clientResponse.data
        : [];

      const mappedInvoices = invoiceData.map((invoice) =>
        mapInvoice(invoice, clientData)
      );

      console.log('MAPPED INVOICES:', mappedInvoices);

      setInvoices(mappedInvoices);

    } catch (err) {
      console.error('FAILED TO FETCH INVOICES:', err);
      console.error('ERROR RESPONSE:', err.response);

      error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to load invoices'
      );
    } finally {
      setLoading(false);
    }
  };


  // Filter and search invoices
  const normalizeSearch = (value) => {
    return String(value || "")
      .toLowerCase()
      .replace(/[\s-]/g, "");
  };

  const isDateInRange = (date, range) => {
    if (!date || range === 'all') return true;

    const invoiceDate = new Date(date);
    const today = new Date();

    // Remove time from both dates
    invoiceDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    switch (range) {
      case 'today':
        return invoiceDate.getTime() === today.getTime();

      case 'week': {
        const startOfWeek = new Date(today);
        const day = today.getDay();

        // Monday = start of week
        const diff = day === 0 ? 6 : day - 1;

        startOfWeek.setDate(today.getDate() - diff);
        startOfWeek.setHours(0, 0, 0, 0);

        return invoiceDate >= startOfWeek && invoiceDate <= today;
      }

      case 'month':
        return (
          invoiceDate.getMonth() === today.getMonth() &&
          invoiceDate.getFullYear() === today.getFullYear() &&
          invoiceDate <= today
        );

      case 'quarter': {
        const currentQuarter = Math.floor(today.getMonth() / 3);

        const startOfQuarter = new Date(
          today.getFullYear(),
          currentQuarter * 3,
          1
        );

        return invoiceDate >= startOfQuarter && invoiceDate <= today;
      }

      case 'year':
        return (
          invoiceDate.getFullYear() === today.getFullYear() &&
          invoiceDate <= today
        );

      default:
        return true;
    }
  };

  const filteredInvoices = useMemo(() => {
    const query = normalizeSearch(searchQuery);

    return invoices.filter((invoice) => {
      // Search text fields
      const searchableValues = [
        invoice.invoiceNumber,
        invoice.client,
        invoice.email,
      ];

      const matchesTextSearch =
        query === "" ||
        searchableValues.some((value) =>
          normalizeSearch(value).includes(query)
        );

      // Exact status search
      const matchesStatusSearch =
        query === "" ||
        normalizeSearch(invoice.status) === query ||
        normalizeSearch(invoice.paymentStatus) === query;

      const matchesSearch =
        query === "" ||
        matchesTextSearch ||
        matchesStatusSearch;

      // Status dropdown
      const matchesStatus =
        statusFilter === "all" ||
        invoice.status === statusFilter;

      // Payment status dropdown
      const matchesPaymentStatus =
        paymentStatusFilter === "all" ||
        invoice.paymentStatus === paymentStatusFilter;

      const matchesDate =
        isDateInRange(invoice.date, dateRange);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPaymentStatus &&
        matchesDate
      );
    });
  }, [
    invoices,
    searchQuery,
    statusFilter,
    paymentStatusFilter,
    dateRange
  ]);



  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: {
        variant: 'neutral',
        label: 'Draft',
      },

      sent: {
        variant: 'info',
        label: 'Sent',
      },

      cancelled: {
        variant: 'danger',
        label: 'Cancelled',
      },
    };

    const config =
      statusMap[status?.toLowerCase()] || {
        variant: 'neutral',
        label: status || 'Unknown',
      };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      paid: {
        variant: 'success',
        label: 'Paid',
      },
      partial: {
        variant: 'warning',
        label: 'Partially Paid',
      },
      unpaid: {
        variant: 'danger',
        label: 'Unpaid',
      },
      overdue: {
        variant: 'danger',
        label: 'Overdue',
      },
    };

    const config =
      statusMap[status?.toLowerCase()] || {
        variant: 'neutral',
        label: status || 'Unknown',
      };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const handleDelete = (invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete?.id) return;

    try {
      await api.delete(`/invoices/${invoiceToDelete.id}`);

      // Remove invoice from local state
      setInvoices((currentInvoices) =>
        currentInvoices.filter(
          (invoice) => invoice.id !== invoiceToDelete.id
        )
      );

      success(
        `Invoice ${invoiceToDelete.invoiceNumber} deleted successfully`
      );

      // Close modal
      setDeleteModalOpen(false);
      setInvoiceToDelete(null);
      setOpenActionMenu(null);

      // Close action menu
      setOpenActionMenu(null);

    } catch (err) {
      console.error("FAILED TO DELETE INVOICE:", err);
      console.error("DELETE RESPONSE:", err?.response);

      error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to delete invoice"
      );
    }
  };

  const handleDuplicate = (invoice) => {
    success(`Invoice duplicated: ${invoice.id}-COPY`);
  };

  const handleSend = (invoice) => {
    if (!invoice.email) {
      error("This client does not have an email address.");
      return;
    }

    const subject = `Invoice ${invoice.invoiceNumber}`;

    const body = `Hello ${invoice.client},

Please find your invoice details below.

Invoice Number: ${invoice.invoiceNumber}
Invoice Date: ${invoice.date ? formatDate(invoice.date) : "-"}
Due Date: ${invoice.dueDate ? formatDate(invoice.dueDate) : "-"}
Amount: ${formatCurrency(invoice.amount, "USD")}
Payment Status: ${invoice.paymentStatus || "Unpaid"}

Thank you for your business.

Regards,
Your Company`;

    const mailtoUrl =
      `mailto:${encodeURIComponent(invoice.email)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;

    success(
      `Email prepared for ${invoice.email}`
    );

    setOpenActionMenu(null);
  };

  const handleDownload = async (invoice) => {
    try {
      // Generate the PDF
      await api.post(`/invoices/${invoice.id}/pdf`);

      // Download the generated PDF
      const response = await api.get(
        `/invoices/${invoice.id}/pdf`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `invoice_${invoice.invoiceNumber}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      success(
        `Invoice ${invoice.invoiceNumber} downloaded successfully`
      );
    } catch (err) {
      console.error(
        "FAILED TO DOWNLOAD INVOICE:",
        err
      );

      console.error(
        "DOWNLOAD RESPONSE:",
        err?.response
      );

      error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to download invoice."
      );
    }
  };
  const handleExport = () => {
    try {
      if (filteredInvoices.length === 0) {
        error("No invoices available to export");
        return;
      }

      const headers = [
        "Invoice Number",
        "Client Name",
        "Client Email",
        "Amount",
        "Invoice Status",
        "Payment Status",
        "Issue Date",
        "Due Date",
        "Amount Paid",
        "Amount Due",
        "Subtotal",
        "Discount",
        "Tax Amount",
        "Notes",
      ];

      const rows = filteredInvoices.map((invoice) => [
        invoice.invoiceNumber || "",
        invoice.client || "",
        invoice.email || "",
        invoice.amount || 0,
        invoice.status || "",
        invoice.paymentStatus || "",
        invoice.date || "",
        invoice.dueDate || "",
        invoice.amountPaid || 0,
        invoice.amountDue || 0,
        invoice.subtotal || 0,
        invoice.discount || 0,
        invoice.taxAmount || 0,
        invoice.notes || "",
      ]);

      // Escape CSV values safely
      const escapeCSV = (value) => {
        const stringValue = String(value ?? "");

        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      };

      const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map((row) =>
          row.map(escapeCSV).join(",")
        ),
      ].join("\n");

      // Add UTF-8 BOM for Excel compatibility
      const blob = new Blob(
        ["\uFEFF" + csvContent],
        {
          type: "text/csv;charset=utf-8;",
        }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      const today = new Date()
        .toISOString()
        .split("T")[0];

      link.download = `invoices_${today}.csv`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      success(
        `${filteredInvoices.length} invoice${filteredInvoices.length !== 1 ? "s" : ""
        } exported successfully`
      );
    } catch (err) {
      console.error("EXPORT ERROR:", err);

      error("Failed to export invoices");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Invoice History
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and track all your invoices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<FiDownload size={18} />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Link to="/invoices/create">
            <Button leftIcon={<FiPlus size={18} />}>
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}

      {/* Invoice Status */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Invoice Status
          </h2>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total: {invoices.length}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total */}
          <Card hover className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Total
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {invoices.length}
            </p>
          </Card>

          {/* Draft */}
          <Card hover className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Draft
            </p>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {invoices.filter(i => i.status === 'draft').length}
            </p>
          </Card>

          {/* Sent */}
          <Card hover className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Sent
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {invoices.filter(i => i.status === 'sent').length}
            </p>
          </Card>

          {/* Cancelled */}
          <Card hover className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Cancelled
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {invoices.filter(i => i.status === 'cancelled').length}
            </p>
          </Card>
        </div>
      </div>


      {/* Payment Status */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Payment Status
          </h2>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total: {invoices.length}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* Paid */}
          <Card hover className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Paid
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {invoices.filter(i => i.paymentStatus === 'paid').length}
            </p>
          </Card>

          {/* Partially Paid */}
          <Card hover className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Partially Paid
            </p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {invoices.filter(i => i.paymentStatus === 'partial').length}
            </p>
          </Card>

          {/* Unpaid */}
          <Card hover className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Unpaid
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {invoices.filter(i => i.paymentStatus === 'unpaid').length}
            </p>
          </Card>

          {/* Overdue */}
          <Card hover className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Overdue
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {invoices.filter(i => i.paymentStatus === 'overdue').length}
            </p>
          </Card>

        </div>
      </div>
      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-96">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by invoice number, client, or email..."
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Invoice Status' },
                { value: 'draft', label: 'Draft' },
                { value: 'sent', label: 'Sent' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              className="w-40"
            />
            <Select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Payment Status' },
                { value: 'paid', label: 'Paid' },
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'partial', label: 'Partially Paid' },
                { value: 'overdue', label: 'Overdue' },
              ]}
              className="w-44"
            />
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'quarter', label: 'This Quarter' },
                { value: 'year', label: 'This Year' },
              ]}
              className="w-40"
            />
          </div>
        </div>
      </Card>

      {/* Invoice Table */}
      <Card padding={false}>
        <div className="overflow-x-auto overflow-y-visible">
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Header>
                  Invoice Id
                </Table.Header>
                <Table.Header>
                  Client Name
                </Table.Header>
                <Table.Header>
                  Amount
                </Table.Header>
                <Table.Header>
                  Status
                </Table.Header>
                <Table.Header>
                  Payment
                </Table.Header>
                <Table.Header>
                  Issue Date
                </Table.Header>
                <Table.Header>
                  Due Date
                </Table.Header>
                <Table.Header align="right">Actions</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((invoice) => (
                  <Table.Row key={invoice.id} clickable>
                    <Table.Cell>
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="text-sm font-medium text-primary hover:text-primary-dark"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {invoice.client}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {invoice.email}
                        </p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(invoice.amount, 'USD')}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      {getStatusBadge(invoice.status)}
                    </Table.Cell>

                    <Table.Cell>
                      {getPaymentStatusBadge(invoice.paymentStatus)}
                    </Table.Cell>

                    <Table.Cell className="text-gray-500 dark:text-gray-400">
                      {formatDate(invoice.date)}
                    </Table.Cell>
                    <Table.Cell className={invoice.status === 'overdue' ? 'text-danger font-medium' : 'text-gray-500 dark:text-gray-400'}>
                      {invoice.dueDate ? formatDate(invoice.dueDate) : 'No due Date'}
                    </Table.Cell>
                    <Table.Cell align="right">
                      <div className="relative flex items-center justify-end">

                        {/* Horizontal Action Menu - overlays existing content */}
                        {openActionMenu === invoice.id && (
                          <div className="absolute right-10 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1">

                            {/* View */}
                            <button
                              type="button"
                              onClick={() => navigate(`/invoices/${invoice.id}`)}
                              title="View invoice"
                              className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                            >
                              <FiEye size={16} />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                              title="Edit invoice"
                              className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                            >
                              <FiEdit2 size={16} />
                            </button>

                            {/* Send */}
                            <button
                              type="button"
                              onClick={() => handleSend(invoice)}
                              title="Send invoice"
                              className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                            >
                              <FiSend size={16} />
                            </button>

                            {/* Download */}
                            <button
                              type="button"
                              onClick={() => handleDownload(invoice)}
                              title="Download invoice"
                              className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                            >
                              <FiDownload size={16} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(invoice)}
                              title="Delete invoice"
                              className="p-2 text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        )}

                        {/* Chevron stays fixed */}
                        <button
                          type="button"
                          onClick={() =>
                            setOpenActionMenu(
                              openActionMenu === invoice.id ? null : invoice.id
                            )
                          }
                          title="Actions"
                          className={`relative z-50 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all ${openActionMenu === invoice.id
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : ''
                            }`}
                        >
                          <FiChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${openActionMenu === invoice.id ? 'rotate-90' : ''
                              }`}
                          />
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.EmptyState
                  colSpan={8}
                  message={searchQuery || statusFilter !== 'all' ? 'No invoices match your filters' : 'No invoices found'}
                />
              )}
            </Table.Body>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal.Confirm
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${invoiceToDelete?.invoiceNumber}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default AllInvoices;