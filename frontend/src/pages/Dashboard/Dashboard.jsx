import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import {
  FiDollarSign,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiDownload,
  FiSend,
  FiPlus,
  FiUsers,
} from "react-icons/fi";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../utils/axiosInstance";

// ============================================================
// HELPERS
// ============================================================

const money = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getInvoiceCurrency = (invoice, fallbackCurrency = "INR") => {
  return (
    invoice.currency ||
    invoice.currency_code ||
    invoice.currencyCode ||
    fallbackCurrency
  ).toUpperCase();
};

const getCurrencySymbol = (currency) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value || currency;
  } catch {
    return currency;
  }
};

// ============================================================
// MONTH NAMES
// ============================================================

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ============================================================
// COMPONENT
// ============================================================

const Dashboard = () => {
  const { user } = useAuth();
  const { error, success } = useToast();

  // ==========================================================
  // STATE
  // ==========================================================

  const [dashboardData, setDashboardData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState("Last 6 months");


  const [exchangeRates, setExchangeRates] = useState({});
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [selectedReminderInvoices, setSelectedReminderInvoices] = useState([]);
  const [selectedReminderClient, setSelectedReminderClient] = useState(null);

  // ==========================================================
  // FETCH DASHBOARD DATA
  // ==========================================================

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        summaryResponse,
        invoicesResponse,
        clientsResponse,
      ] = await Promise.all([
        api.dashboard.summary(),
        api.invoices.list(),
        api.clients.list(),
      ]);

      // SUMMARY
      setDashboardData(summaryResponse.data || {});

      // INVOICES
      const invoiceData = Array.isArray(invoicesResponse.data)
        ? invoicesResponse.data
        : invoicesResponse.data?.invoices || [];

      setInvoices(invoiceData);

      // CLIENTS
      const clientData = Array.isArray(clientsResponse.data)
        ? clientsResponse.data
        : clientsResponse.data?.clients || [];

      setClients(clientData);
    } catch (err) {
      console.error("DASHBOARD FETCH ERROR:", err);
      console.error("DASHBOARD RESPONSE:", err.response);

      error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ==========================================================
  // CLIENT MAP
  // ==========================================================

  const clientMap = useMemo(() => {
    const map = {};

    clients.forEach((client) => {
      map[client.id] =
        client.company_name ||
        client.name ||
        "Unknown Client";
    });

    return map;
  }, [clients]);

  const currency =
    user?.currency ||
    user?.profile?.currency ||
    "INR";

  const reminderInvoices = useMemo(() => {
    return invoices
      .filter((invoice) => {
        const status =
          invoice.payment_status ||
          invoice.paymentStatus ||
          invoice.status ||
          "unpaid";

        return (
          status === "partial" ||
          status === "unpaid"
        );
      })
      .map((invoice) => {
        const client = clients.find(
          (c) => c.id === invoice.client_id
        );

        const total = money(invoice.grand_total);
        const paid = money(invoice.amount_paid);

        const pending = Math.max(
          total - paid,
          0
        );

        return {
          ...invoice,

          reminderId: invoice.id,

          reminderInvoiceNumber:
            invoice.invoice_number ||
            `INV-${invoice.id}`,

          reminderClientId:
            invoice.client_id,

          reminderClientName:
            client?.company_name ||
            client?.name ||
            invoice.client_name ||
            "Unknown Client",

          reminderEmail:
            client?.email ||
            client?.email_address ||
            "",

          reminderTotal: total,

          reminderPaid: paid,

          reminderPending: pending,

          reminderCurrency:
            getInvoiceCurrency(
              invoice,
              currency
            ),

          reminderStatus:
            invoice.payment_status ||
            invoice.paymentStatus ||
            invoice.status ||
            "unpaid",
        };
      })
      .filter(
        (invoice) =>
          invoice.reminderPending > 0
      );
  }, [invoices, clients, currency]);

  const reminderClients = useMemo(() => {
    const grouped = {};

    reminderInvoices.forEach((invoice) => {
      const clientId = invoice.reminderClientId;

      if (!grouped[clientId]) {
        grouped[clientId] = {
          clientId,
          clientName:
            invoice.reminderClientName,
          email:
            invoice.reminderEmail,
          invoices: [],
          totalPending: 0,
        };
      }

      grouped[clientId].invoices.push(invoice);

      grouped[clientId].totalPending +=
        invoice.reminderPending;
    });

    return Object.values(grouped);
  }, [reminderInvoices]);

  const openReminderClient = (client) => {
    setSelectedReminderClient(client);
  };

  const goBackToReminderClients = () => {
    setSelectedReminderClient(null);
  };

  const toggleClientInvoices = (client) => {
    const clientInvoiceIds = client.invoices.map(
      (invoice) => invoice.reminderId
    );

    const allSelected =
      clientInvoiceIds.every((id) =>
        selectedReminderInvoices.includes(id)
      );

    if (allSelected) {
      setSelectedReminderInvoices((prev) =>
        prev.filter(
          (id) => !clientInvoiceIds.includes(id)
        )
      );
    } else {
      setSelectedReminderInvoices((prev) => [
        ...new Set([
          ...prev,
          ...clientInvoiceIds,
        ]),
      ]);
    }
  };

  // ==========================================================
  // REAL DASHBOARD VALUES
  // ==========================================================

  const totalRevenue = money(dashboardData?.total_revenue);

  const totalInvoices =
    Number(dashboardData?.total_invoices) || 0;

  // ==========================================================
  // RECEIVED AMOUNT
  // ==========================================================

  const receivedAmount = useMemo(() => {
    return invoices
      .filter(
        (invoice) => invoice.status !== "cancelled"
      )
      .reduce(
        (sum, invoice) =>
          sum + money(invoice.amount_paid),
        0
      );
  }, [invoices]);

  // ==========================================================
  // PENDING AMOUNT
  // ==========================================================

  const pendingAmount = useMemo(() => {
    return invoices
      .filter(
        (invoice) => invoice.status !== "cancelled"
      )
      .reduce((sum, invoice) => {
        const total = money(invoice.grand_total);
        const paid = money(invoice.amount_paid);

        return sum + Math.max(total - paid, 0);
      }, 0);
  }, [invoices]);

  // ==========================================================
  // STATS
  // ==========================================================

  const stats = [
    {
      title: "Total Revenue",
      value: totalRevenue,
      icon: FiDollarSign,
      color:
        "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      title: "Total Invoices",
      value: totalInvoices,
      icon: FiFileText,
      color:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Received Amount",
      value: receivedAmount,
      icon: FiCheckCircle,
      color:
        "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      title: "Pending Amount",
      value: pendingAmount,
      icon: FiClock,
      color:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    },
  ];

  // ==========================================================
  // CURRENCY
  // ==========================================================

  const formatCurrency = (
    amount,
    currencyCode = currency
  ) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(money(amount));
  };

  // ==========================================================
  // EXPORT REPORT
  // ==========================================================

  const handleExportReport = () => {
    if (!invoices.length) {
      error("No invoice data available to export.");
      return;
    }

    const headers = [
      "Invoice Number",
      "Client",
      "Invoice Date",
      "Due Date",
      "Subtotal",
      "Tax",
      "Discount",
      "Grand Total",
      "Amount Paid",
      "Amount Pending",
      "Status",
    ];

    const rows = invoices.map((invoice) => {
      const total = money(invoice.grand_total);
      const paid = money(invoice.amount_paid);
      const pending = Math.max(total - paid, 0);

      const client =
        clientMap[invoice.client_id] ||
        invoice.client_name ||
        "Unknown Client";

      const status =
        invoice.payment_status ||
        invoice.status ||
        "unpaid";

      return [
        invoice.invoice_number ||
        `INV-${invoice.id}`,
        client,
        invoice.invoice_date || "",
        invoice.due_date || "",
        money(invoice.subtotal),
        money(invoice.tax_amount || invoice.tax),
        money(
          invoice.discount_amount ||
          invoice.discount
        ),
        total,
        paid,
        pending,
        status,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const stringValue = String(value ?? "");

            if (
              stringValue.includes(",") ||
              stringValue.includes('"') ||
              stringValue.includes("\n")
            ) {
              return `"${stringValue.replace(
                /"/g,
                '""'
              )}"`;
            }

            return stringValue;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    const today = new Date()
      .toISOString()
      .split("T")[0];

    link.download = `InvoiceFlow_Report_${today}.csv`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    success("Report exported successfully!");
  };

  // ==========================================================
  // SEND PAYMENT REMINDER
  // ==========================================================

  const toggleReminderInvoice = (invoiceId) => {
    setSelectedReminderInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const toggleSelectAllReminders = () => {
    const allInvoiceIds =
      reminderInvoices.map(
        (invoice) => invoice.reminderId
      );

    const allSelected =
      selectedReminderInvoices.length ===
      allInvoiceIds.length &&
      allInvoiceIds.length > 0;

    if (allSelected) {
      setSelectedReminderInvoices([]);
    } else {
      setSelectedReminderInvoices(
        allInvoiceIds
      );
    }
  };

  const selectedReminderTotal = useMemo(() => {
    return reminderInvoices
      .filter((invoice) =>
        selectedReminderInvoices.includes(
          invoice.reminderId
        )
      )
      .reduce(
        (sum, invoice) =>
          sum + invoice.reminderPending,
        0
      );
  }, [
    reminderInvoices,
    selectedReminderInvoices,
  ]);

  const handleSendReminder = async () => {
    // --------------------------------------------------
    // PREVENT DOUBLE CLICK
    // --------------------------------------------------

    if (sendingReminders) {
      return;
    }

    // --------------------------------------------------
    // VALIDATE SELECTION
    // --------------------------------------------------

    if (selectedReminderInvoices.length === 0) {
      error("Please select at least one invoice.");
      return;
    }

    // --------------------------------------------------
    // GET SELECTED INVOICES
    // --------------------------------------------------

    const selectedInvoices = reminderInvoices.filter((invoice) =>
      selectedReminderInvoices.includes(invoice.reminderId)
    );

    // --------------------------------------------------
    // CHECK CLIENT EMAILS
    // --------------------------------------------------

    const invoicesWithoutEmail = selectedInvoices.filter(
      (invoice) => !invoice.reminderEmail
    );

    if (invoicesWithoutEmail.length === selectedInvoices.length) {
      error("None of the selected clients have an email address.");
      return;
    }

    // --------------------------------------------------
    // WARNING FOR INVOICES WITHOUT EMAIL
    // --------------------------------------------------

    if (invoicesWithoutEmail.length > 0) {
      console.warn(
        "Invoices without email:",
        invoicesWithoutEmail
      );
    }

    // --------------------------------------------------
    // GET VALID INVOICE IDs
    // --------------------------------------------------

    const invoiceIds = selectedInvoices
      .filter((invoice) => invoice.reminderEmail)
      .map((invoice) => invoice.reminderId);

    if (invoiceIds.length === 0) {
      error("No valid invoices selected.");
      return;
    }

    // --------------------------------------------------
    // START LOADING
    // --------------------------------------------------

    setSendingReminders(true);

    try {
      // ------------------------------------------------
      // SEND PAYMENT REMINDERS
      // ------------------------------------------------

      const response = await api.invoices.sendReminders(invoiceIds);

      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------

      success(
        response?.data?.message ||
        "Payment reminders sent successfully."
      );

      // ------------------------------------------------
      // CLOSE MODAL ONLY AFTER REQUEST FINISHES
      // ------------------------------------------------

      setShowReminderModal(false);
      setSelectedReminderClient(null);
      setSelectedReminderInvoices([]);

    } catch (err) {
      // ------------------------------------------------
      // ERROR
      // ------------------------------------------------

      console.error("SEND REMINDER ERROR:", err);
      console.error("SEND REMINDER RESPONSE:", err?.response);
      console.error(
        "SEND REMINDER RESPONSE DATA:",
        err?.response?.data
      );

      error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to send payment reminders."
      );

    } finally {
      // ------------------------------------------------
      // STOP LOADING
      // ------------------------------------------------

      setSendingReminders(false);
    }
  };

  // ==========================================================
  // INVOICE STATUS CHART
  // ==========================================================

  const invoiceStatusData = useMemo(() => {
    if (!dashboardData) {
      return [];
    }

    return [
      {
        name: "Paid",
        value:
          Number(
            dashboardData.paid_invoices
          ) || 0,
        color: "#16A34A",
      },
      {
        name: "Partial",
        value:
          Number(
            dashboardData.partial_invoices
          ) || 0,
        color: "#F59E0B",
      },
      {
        name: "Unpaid",
        value:
          Number(
            dashboardData.unpaid_invoices
          ) || 0,
        color: "#DC2626",
      },
      {
        name: "Draft",
        value:
          Number(
            dashboardData.draft_invoices
          ) || 0,
        color: "#64748B",
      },
      {
        name: "Cancelled",
        value:
          Number(
            dashboardData.cancelled_invoices
          ) || 0,
        color: "#94A3B8",
      },
    ].filter(
      (item) => item.value > 0
    );
  }, [dashboardData]);

  // ==========================================================
  // REVENUE CHART
  // ==========================================================

  const revenueData = useMemo(() => {
    const today = new Date();

    let months = 6;

    if (revenuePeriod === "Last year") {
      months = 12;
    }

    if (revenuePeriod === "All time") {
      if (invoices.length === 0) {
        return [];
      }

      const dates = invoices
        .filter(
          (invoice) =>
            invoice.status !== "cancelled"
        )
        .map(
          (invoice) =>
            new Date(invoice.invoice_date)
        )
        .filter(
          (date) =>
            !Number.isNaN(date.getTime())
        );

      if (dates.length === 0) {
        return [];
      }

      const oldestYear = Math.min(
        ...dates.map((date) =>
          date.getFullYear()
        )
      );

      const currentYear =
        today.getFullYear();

      const result = [];

      for (
        let year = oldestYear;
        year <= currentYear;
        year++
      ) {
        const revenue = invoices
          .filter((invoice) => {
            if (
              invoice.status ===
              "cancelled"
            ) {
              return false;
            }

            const date = new Date(
              invoice.invoice_date
            );

            return (
              date.getFullYear() === year
            );
          })
          .reduce(
            (sum, invoice) =>
              sum +
              money(
                invoice.grand_total
              ),
            0
          );

        result.push({
          month: String(year),
          revenue,
        });
      }

      return result;
    }

    const result = [];

    for (
      let i = months - 1;
      i >= 0;
      i--
    ) {
      const date = new Date(
        today.getFullYear(),
        today.getMonth() - i,
        1
      );

      const month = date.getMonth();
      const year = date.getFullYear();

      const revenue = invoices
        .filter((invoice) => {
          if (
            invoice.status ===
            "cancelled"
          ) {
            return false;
          }

          const invoiceDate = new Date(
            invoice.invoice_date
          );

          return (
            invoiceDate.getMonth() ===
            month &&
            invoiceDate.getFullYear() ===
            year
          );
        })
        .reduce(
          (sum, invoice) =>
            sum +
            money(
              invoice.grand_total
            ),
          0
        );

      result.push({
        month: MONTH_NAMES[month],
        revenue,
      });
    }

    return result;
  }, [invoices, revenuePeriod]);

  // ==========================================================
  // RECENT INVOICES
  // ==========================================================

  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort(
        (a, b) =>
          new Date(b.invoice_date) -
          new Date(a.invoice_date)
      )
      .slice(0, 5)
      .map((invoice) => ({
        id:
          invoice.invoice_number ||
          `INV-${invoice.id}`,

        invoiceId: invoice.id,

        currency: getInvoiceCurrency(
          invoice,
          currency
        ),

        client:
          clientMap[invoice.client_id] ||
          invoice.client_name ||
          "Unknown Client",

        amount: money(invoice.grand_total),

        status:
          invoice.payment_status ||
          "unpaid",

        date: invoice.invoice_date,
      }));
  }, [invoices, clientMap, currency]);

  // ==========================================================
  // STATUS BADGE
  // ==========================================================

  const getStatusBadge = (status) => {
    const statusMap = {
      paid: {
        variant: "success",
        label: "Paid",
      },
      partial: {
        variant: "warning",
        label: "Partial",
      },
      unpaid: {
        variant: "danger",
        label: "Unpaid",
      },
      draft: {
        variant: "neutral",
        label: "Draft",
      },
      cancelled: {
        variant: "neutral",
        label: "Cancelled",
      },
    };

    const config =
      statusMap[status] ||
      statusMap.unpaid;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  // ==========================================================
  // REVENUE TOOLTIP
  // ==========================================================

  const CustomTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      active &&
      payload &&
      payload.length
    ) {
      return (
        <div className="bg-white dark:bg-dark-card p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatCurrency(
              payload[0].value
            )}
          </p>
        </div>
      );
    }

    return null;
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="text-center py-12 sm:py-16">
          <p className="text-gray-500 dark:text-gray-400">
            Loading dashboard...
          </p>
        </Card>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 break-words">
            Welcome back,{" "}
            {user?.name?.split(" ")[0] ||
              "User"}!
          </h1>

          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening with
            your business today.
          </p>
        </div>

        <div className="flex flex-col xs:flex-row sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">

          <Button
            variant="secondary"
            leftIcon={
              <FiDownload size={18} />
            }
            onClick={handleExportReport}
            className="w-full sm:w-auto justify-center"
          >
            Export Report
          </Button>

          <Link
            to="/invoices/create"
            className="w-full sm:w-auto"
          >
            <Button
              leftIcon={
                <FiPlus size={18} />
              }
              className="w-full sm:w-auto justify-center"
            >
              New Invoice
            </Button>
          </Link>

        </div>
      </div>

      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {stats.map(
          (stat, index) => (
            <motion.div
              key={stat.title}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  index * 0.1,
              }}
              className="min-w-0"
            >
              <Card
                hover
                className="relative overflow-hidden h-full"
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">

                  <div className="min-w-0 flex-1">

                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>

                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 break-words">
                      {typeof stat.value ===
                        "number"
                        ? stat.title.includes(
                          "Amount"
                        ) ||
                          stat.title ===
                          "Total Revenue"
                          ? formatCurrency(
                            stat.value
                          )
                          : stat.value.toLocaleString()
                        : stat.value}
                    </h3>

                  </div>

                  <div
                    className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${stat.color}`}
                  >
                    <stat.icon
                      size={18}
                      className="sm:w-5 sm:h-5"
                    />
                  </div>

                </div>
              </Card>
            </motion.div>
          )
        )}

      </div>

      {/* ======================================================
          CHARTS
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* REVENUE */}

        <Card className="lg:col-span-2 min-w-0">

          <Card.Header>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">

              <Card.Title>
                Revenue Overview
              </Card.Title>

              <select
                value={revenuePeriod}
                onChange={(e) =>
                  setRevenuePeriod(
                    e.target.value
                  )
                }
                className="w-full sm:w-auto text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300"
              >
                <option>
                  Last 6 months
                </option>

                <option>
                  Last year
                </option>

                <option>
                  All time
                </option>
              </select>

            </div>
          </Card.Header>

          <div className="h-56 sm:h-64 md:h-72 w-full min-w-0">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={revenueData}
                margin={{
                  top: 10,
                  right: 5,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748B",
                    fontSize: 11,
                  }}
                  interval="preserveStartEnd"
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748B",
                    fontSize: 11,
                  }}
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `${value / 1000}k`
                      : value
                  }
                  width={45}
                />

                <Tooltip
                  content={
                    <CustomTooltip />
                  }
                />

                <Bar
                  dataKey="revenue"
                  fill="#2563EB"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                  barSize={28}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>

          </div>
        </Card>

        {/* STATUS */}

        <Card className="min-w-0">

          <Card.Header>
            <Card.Title>
              Invoice Status
            </Card.Title>
          </Card.Header>

          <div className="h-56 sm:h-64 md:h-52 w-full min-w-0">

            {invoiceStatusData.length >
              0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={
                      invoiceStatusData
                    }
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {invoiceStatusData.map(
                      (
                        entry,
                        index
                      ) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.color
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                    height={45}
                    formatter={(
                      value,
                      entry
                    ) => (
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {
                          entry
                            .payload
                            .name
                        }
                        :{" "}
                        {
                          entry
                            .payload
                            .value
                        }
                      </span>
                    )}
                  />

                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-gray-500">
                  No invoice data
                </p>
              </div>
            )}

          </div>
        </Card>

      </div>

      {/* ======================================================
          RECENT INVOICES + ACTIVITY
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* RECENT INVOICES */}

        <Card className="lg:col-span-2 min-w-0">

          <Card.Header>
            <div className="flex items-center justify-between gap-3 w-full">

              <Card.Title>
                Recent Invoices
              </Card.Title>

              <Link
                to="/invoices"
                className="text-xs sm:text-sm text-primary font-medium hover:text-primary-dark whitespace-nowrap"
              >
                View All
              </Link>

            </div>
          </Card.Header>

          {recentInvoices.length ===
            0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-500">
                No invoices yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full min-w-[650px]">

                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">

                    <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Invoice
                    </th>

                    <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client
                    </th>

                    <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>

                    <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>

                    <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {recentInvoices.map(
                    (invoice) => (
                      <tr
                        key={
                          invoice.invoiceId
                        }
                        className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >

                        <td className="py-3 px-3 sm:px-4">
                          <Link
                            to={`/invoices/${invoice.invoiceId}`}
                            className="text-sm font-medium text-primary hover:text-primary-dark whitespace-nowrap"
                          >
                            {getCurrencySymbol(invoice.currency)}{" "}
                            {invoice.id}
                          </Link>
                        </td>

                        <td className="py-3 px-3 sm:px-4 text-sm text-gray-700 dark:text-gray-300 max-w-[180px]">
                          <span className="block truncate">
                            {
                              invoice.client
                            }
                          </span>
                        </td>

                        <td className="py-3 px-3 sm:px-4 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {formatCurrency(
                            invoice.amount,
                            invoice.currency
                          )}
                        </td>

                        <td className="py-3 px-3 sm:px-4">
                          {getStatusBadge(
                            invoice.status
                          )}
                        </td>

                        <td className="py-3 px-3 sm:px-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {invoice.date
                            ? new Date(
                              invoice.date
                            ).toLocaleDateString(
                              "en-IN"
                            )
                            : "-"}
                        </td>

                      </tr>
                    )
                  )}
                </tbody>

              </table>
            </div>
          )}
        </Card>

        {/* RECENT ACTIVITY */}

        <Card className="min-w-0">

          <Card.Header>
            <Card.Title>
              Recent Activity
            </Card.Title>
          </Card.Header>

          <div className="space-y-4">

            {recentInvoices
              .slice(0, 5)
              .map(
                (invoice) => (
                  <div
                    key={
                      invoice.invoiceId
                    }
                    className="flex items-start gap-3 min-w-0"
                  >

                    <div
                      className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${invoice.status ===
                        "paid"
                        ? "bg-green-500"
                        : invoice.status ===
                          "partial"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                        }`}
                    />

                    <div className="flex-1 min-w-0">

                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">

                        Invoice{" "}
                        <span className="font-medium">
                          {
                            invoice.id
                          }
                        </span>{" "}
                        for{" "}
                        <span className="break-words">
                          {
                            invoice.client
                          }
                        </span>

                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {invoice.date
                          ? new Date(
                            invoice.date
                          ).toLocaleDateString(
                            "en-IN"
                          )
                          : "-"}
                      </p>

                    </div>
                  </div>
                )
              )}

            {recentInvoices.length ===
              0 && (
                <p className="text-sm text-gray-500">
                  No recent activity.
                </p>
              )}

          </div>
        </Card>

      </div>

      {/* ======================================================
          QUICK ACTIONS
      ====================================================== */}

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">

        {/* VIEW INVOICES */}

        <Link
          to="/invoices"
          className="min-w-0"
        >
          <Card
            hover
            className="flex items-center gap-3 sm:gap-4 cursor-pointer group h-full"
          >
            <div className="p-2.5 sm:p-3 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
              <FiFileText
                size={20}
              />
            </div>

            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
              View Invoices
            </span>
          </Card>
        </Link>

        {/* MANAGE CLIENTS */}

        <Link
          to="/clients"
          className="min-w-0"
        >
          <Card
            hover
            className="flex items-center gap-3 sm:gap-4 cursor-pointer group h-full"
          >
            <div className="p-2.5 sm:p-3 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
              <FiUsers size={20} />
            </div>

            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
              Manage Clients
            </span>
          </Card>
        </Link>

        {/* SEND REMINDER */}

        <button
          type="button"
          onClick={() => {
            if (reminderInvoices.length === 0) {
              error("There are no unpaid or partially paid invoices.");
              return;
            }

            setSelectedReminderInvoices([]);
            setSelectedReminderClient(null);
            setShowReminderModal(true);
          }}
          className="text-left min-w-0 w-full"
        >
          <Card
            hover
            className="flex items-center gap-3 sm:gap-4 cursor-pointer group h-full"
          >
            <div className="p-2.5 sm:p-3 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
              <FiSend size={20} />
            </div>

            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
              Send Reminder
            </span>
          </Card>
        </button>

        {/* REPORTS */}

        <Link
          to="/reports"
          className="min-w-0"
        >
          <Card
            hover
            className="flex items-center gap-3 sm:gap-4 cursor-pointer group h-full"
          >
            <div className="p-2.5 sm:p-3 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
              <FiTrendingUp
                size={20}
              />
            </div>

            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
              View Reports
            </span>
          </Card>
        </Link>

      </div>
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-dark-card shadow-2xl">

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <div className="flex items-center gap-3 p-5 border-b border-gray-200 dark:border-gray-700">

              {selectedReminderClient && (
                <button
                  type="button"
                  onClick={goBackToReminderClients}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ←
                </button>
              )}

              <div className="flex-1">

                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedReminderClient
                    ? selectedReminderClient.clientName
                    : "Send Payment Reminders"}
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">

                  {selectedReminderClient
                    ? selectedReminderClient.email ||
                    "No email address"
                    : "Select a client to view their outstanding invoices."}

                </p>

              </div>

              <button
                type="button"
                disabled={sendingReminders}
                onClick={() => {
                  if (sendingReminders) return;

                  setShowReminderModal(false);
                  setSelectedReminderClient(null);
                  setSelectedReminderInvoices([]);
                }}
                className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl ${sendingReminders
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                  }`}
              >
                ×
              </button>

            </div>

            {/* ================================================= */}
            {/* CONTENT */}
            {/* ================================================= */}

            <div className="overflow-y-auto max-h-[60vh] p-5">

              {/* ================================================= */}
              {/* LEVEL 1 — CLIENTS */}
              {/* ================================================= */}

              {!selectedReminderClient && (

                <>

                  {/* SELECT ALL */}

                  <div className="flex items-center justify-between mb-4">

                    <label className="flex items-center gap-3 cursor-pointer">

                      <input
                        type="checkbox"
                        checked={
                          reminderInvoices.length > 0 &&
                          selectedReminderInvoices.length ===
                          reminderInvoices.length
                        }
                        onChange={
                          toggleSelectAllReminders
                        }
                        className="w-4 h-4 rounded"
                      />

                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select All Invoices
                      </span>

                    </label>

                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {reminderClients.length} client
                      {reminderClients.length !== 1
                        ? "s"
                        : ""}
                    </span>

                  </div>

                  {/* CLIENT LIST */}

                  <div className="space-y-3">

                    {reminderClients.map(
                      (client) => {

                        const clientInvoiceIds =
                          client.invoices.map(
                            (invoice) =>
                              invoice.reminderId
                          );

                        const selectedCount =
                          clientInvoiceIds.filter(
                            (id) =>
                              selectedReminderInvoices.includes(
                                id
                              )
                          ).length;

                        const clientFullySelected =
                          selectedCount ===
                          clientInvoiceIds.length &&
                          clientInvoiceIds.length > 0;

                        return (
                          <div
                            key={client.clientId}
                            className={`p-4 rounded-xl border transition-all ${clientFullySelected
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 dark:border-gray-700"
                              }`}
                          >

                            <div className="flex items-center gap-3">

                              {/* CLIENT CHECKBOX */}

                              <input
                                type="checkbox"
                                checked={
                                  clientFullySelected
                                }
                                onChange={() =>
                                  toggleClientInvoices(
                                    client
                                  )
                                }
                                className="w-4 h-4 rounded"
                              />

                              {/* CLIENT INFO */}

                              <button
                                type="button"
                                onClick={() =>
                                  openReminderClient(
                                    client
                                  )
                                }
                                className="flex-1 text-left"
                              >

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                                  <div>

                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                      {
                                        client.clientName
                                      }
                                    </p>

                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {client.email ||
                                        "No email address"}
                                    </p>

                                  </div>

                                  <div className="text-left sm:text-right">

                                    <p className="text-sm font-semibold text-red-600">
                                      {formatCurrency(
                                        client.totalPending
                                      )}
                                    </p>

                                    <p className="text-xs text-gray-500">
                                      {
                                        client.invoices
                                          .length
                                      }{" "}
                                      outstanding invoice
                                      {client.invoices
                                        .length !==
                                        1
                                        ? "s"
                                        : ""}
                                    </p>

                                  </div>

                                </div>

                              </button>

                              {/* ARROW */}

                              <button
                                type="button"
                                onClick={() =>
                                  openReminderClient(
                                    client
                                  )
                                }
                                className="p-2 text-gray-400 hover:text-primary"
                              >
                                →
                              </button>

                            </div>

                            {/* SELECTED INFO */}

                            {selectedCount > 0 && (
                              <div className="mt-3 ml-7 text-xs text-primary">

                                {selectedCount} of{" "}
                                {
                                  client.invoices
                                    .length
                                }{" "}
                                invoices selected

                              </div>
                            )}

                          </div>
                        );
                      }
                    )}

                  </div>

                </>

              )}

              {/* ================================================= */}
              {/* LEVEL 2 — CLIENT INVOICES */}
              {/* ================================================= */}

              {selectedReminderClient && (

                <>

                  {/* CLIENT SUMMARY */}

                  <div className="mb-5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {
                            selectedReminderClient.clientName
                          }
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {
                            selectedReminderClient.email ||
                            "No email address"
                          }
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-xs text-gray-500">
                          Total Pending
                        </p>

                        <p className="font-bold text-red-600">
                          {formatCurrency(
                            selectedReminderClient.totalPending
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* SELECT ALL CLIENT INVOICES */}

                  <div className="flex items-center justify-between mb-4">

                    <label className="flex items-center gap-3 cursor-pointer">

                      <input
                        type="checkbox"
                        checked={
                          selectedReminderClient.invoices.every(
                            (invoice) =>
                              selectedReminderInvoices.includes(
                                invoice.reminderId
                              )
                          )
                        }
                        onChange={() =>
                          toggleClientInvoices(
                            selectedReminderClient
                          )
                        }
                        className="w-4 h-4 rounded"
                      />

                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select All Invoices
                      </span>

                    </label>

                    <span className="text-sm text-gray-500">
                      {
                        selectedReminderClient
                          .invoices.length
                      }{" "}
                      invoices
                    </span>

                  </div>

                  {/* INVOICES */}

                  <div className="space-y-3">

                    {selectedReminderClient.invoices.map(
                      (invoice) => {

                        const selected =
                          selectedReminderInvoices.includes(
                            invoice.reminderId
                          );

                        return (
                          <div
                            key={invoice.reminderId}
                            onClick={() =>
                              toggleReminderInvoice(
                                invoice.reminderId
                              )
                            }
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selected
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                              }`}
                          >

                            <div className="flex items-start gap-3">

                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() =>
                                  toggleReminderInvoice(
                                    invoice.reminderId
                                  )
                                }
                                onClick={(e) =>
                                  e.stopPropagation()
                                }
                                className="mt-1 w-4 h-4 rounded"
                              />

                              <div className="flex-1">

                                <div className="flex items-center justify-between gap-2">

                                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {
                                      invoice.reminderInvoiceNumber
                                    }
                                  </p>

                                  <Badge
                                    variant={
                                      invoice.reminderStatus ===
                                        "partial"
                                        ? "warning"
                                        : "danger"
                                    }
                                  >
                                    {invoice.reminderStatus ===
                                      "partial"
                                      ? "Partial"
                                      : "Unpaid"}
                                  </Badge>

                                </div>

                                <div className="grid grid-cols-3 gap-3 mt-4">

                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Total
                                    </p>

                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                      {formatCurrency(
                                        invoice.reminderTotal,
                                        invoice.reminderCurrency
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Paid
                                    </p>

                                    <p className="text-sm font-semibold text-green-600">
                                      {formatCurrency(
                                        invoice.reminderPaid,
                                        invoice.reminderCurrency
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Pending
                                    </p>

                                    <p className="text-sm font-semibold text-red-600">
                                      {formatCurrency(
                                        invoice.reminderPending,
                                        invoice.reminderCurrency
                                      )}
                                    </p>
                                  </div>

                                </div>

                              </div>

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                </>

              )}

            </div>

            {/* ================================================= */}
            {/* FOOTER */}
            {/* ================================================= */}

            <div className="border-t border-gray-200 dark:border-gray-700 p-5">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>

                  <p className="text-xs text-gray-500">
                    Selected Invoices
                  </p>

                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {
                      selectedReminderInvoices.length
                    }
                  </p>

                </div>

                <div>

                  <p className="text-xs text-gray-500">
                    Total Pending
                  </p>

                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(
                      selectedReminderTotal
                    )}
                  </p>

                </div>

                <div className="flex gap-2">

                  <Button
                    variant="secondary"
                    disabled={sendingReminders}
                    onClick={() => {
                      setShowReminderModal(false);
                      setSelectedReminderClient(null);
                      setSelectedReminderInvoices([]);
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    leftIcon={
                      sendingReminders ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiSend size={16} />
                      )
                    }
                    onClick={handleSendReminder}
                    disabled={
                      selectedReminderInvoices.length === 0 ||
                      sendingReminders
                    }
                  >
                    {sendingReminders
                      ? "Sending..."
                      : "Send Reminder"}
                  </Button>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Dashboard;