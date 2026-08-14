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
  const { error } = useToast();

  // ==========================================================
  // STATE
  // ==========================================================

  const [dashboardData, setDashboardData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(true);

  const [revenuePeriod, setRevenuePeriod] =
    useState("Last 6 months");


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


      // ------------------------------------------------------
      // SUMMARY
      // ------------------------------------------------------

      setDashboardData(
        summaryResponse.data || {}
      );


      // ------------------------------------------------------
      // INVOICES
      // ------------------------------------------------------

      const invoiceData = Array.isArray(
        invoicesResponse.data
      )
        ? invoicesResponse.data
        : invoicesResponse.data?.invoices || [];

      setInvoices(invoiceData);


      // ------------------------------------------------------
      // CLIENTS
      // ------------------------------------------------------

      const clientData = Array.isArray(
        clientsResponse.data
      )
        ? clientsResponse.data
        : clientsResponse.data?.clients || [];

      setClients(clientData);

    } catch (err) {

      console.error(
        "DASHBOARD FETCH ERROR:",
        err
      );

      console.error(
        "DASHBOARD RESPONSE:",
        err.response
      );

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


  // ==========================================================
  // REAL DASHBOARD VALUES
  // ==========================================================

  const totalRevenue = money(
    dashboardData?.total_revenue
  );

  const totalInvoices =
    Number(
      dashboardData?.total_invoices
    ) || 0;

  const paidInvoices =
    Number(
      dashboardData?.paid_invoices
    ) || 0;

  const pendingInvoices =
    (Number(
      dashboardData?.partial_invoices
    ) || 0) +
    (Number(
      dashboardData?.unpaid_invoices
    ) || 0);


  // ==========================================================
  // RECEIVED AMOUNT
  // ==========================================================
  //
  // paid_amount from backend contains the grand total of
  // fully paid invoices.
  //
  // For partial invoices we use invoice.amount_paid.
  //
  // ==========================================================

  const receivedAmount = useMemo(() => {

    return invoices
      .filter(
        (invoice) =>
          invoice.status !== "cancelled"
      )
      .reduce(
        (sum, invoice) =>
          sum +
          money(invoice.amount_paid),
        0
      );

  }, [invoices]);


  // ==========================================================
  // PENDING AMOUNT
  // ==========================================================

  const pendingAmount = useMemo(() => {

    return invoices
      .filter(
        (invoice) =>
          invoice.status !== "cancelled"
      )
      .reduce(
        (sum, invoice) => {

          const total =
            money(invoice.grand_total);

          const paid =
            money(invoice.amount_paid);

          return (
            sum +
            Math.max(
              total - paid,
              0
            )
          );

        },
        0
      );

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
  //
  // Change this to profile currency later if your profile
  // context exposes it.
  //
  // ==========================================================

  const currency =
    user?.currency ||
    user?.profile?.currency ||
    "INR";


  const formatCurrency = (amount) => {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(
      money(amount)
    );

  };

  // Export function
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
        invoice.invoice_number || `INV-${invoice.id}`,
        client,
        invoice.invoice_date || "",
        invoice.due_date || "",
        money(invoice.subtotal),
        money(invoice.tax_amount || invoice.tax),
        money(invoice.discount_amount || invoice.discount),
        total,
        paid,
        pending,
        status,
      ];
    });

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const stringValue = String(value ?? "");

            // Escape commas, quotes and new lines
            if (
              stringValue.includes(",") ||
              stringValue.includes('"') ||
              stringValue.includes("\n")
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }

            return stringValue;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

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
            new Date(
              invoice.invoice_date
            )
        )
        .filter(
          (date) =>
            !Number.isNaN(
              date.getTime()
            )
        );

      if (dates.length === 0) {
        return [];
      }

      const oldestYear =
        Math.min(
          ...dates.map(
            (date) =>
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

        const revenue =
          invoices
            .filter(
              (invoice) => {

                if (
                  invoice.status ===
                  "cancelled"
                ) {
                  return false;
                }

                const date =
                  new Date(
                    invoice.invoice_date
                  );

                return (
                  date.getFullYear() ===
                  year
                );
              }
            )
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

      const month =
        date.getMonth();

      const year =
        date.getFullYear();

      const revenue =
        invoices
          .filter(
            (invoice) => {

              if (
                invoice.status ===
                "cancelled"
              ) {
                return false;
              }

              const invoiceDate =
                new Date(
                  invoice.invoice_date
                );

              return (
                invoiceDate.getMonth() ===
                month &&
                invoiceDate.getFullYear() ===
                year
              );
            }
          )
          .reduce(
            (sum, invoice) =>
              sum +
              money(
                invoice.grand_total
              ),
            0
          );

      result.push({

        month:
          MONTH_NAMES[month],

        revenue,

      });

    }

    return result;

  }, [
    invoices,
    revenuePeriod,
  ]);


  // ==========================================================
  // RECENT INVOICES
  // ==========================================================

  const recentInvoices = useMemo(() => {

    return [...invoices]

      .sort(
        (a, b) =>
          new Date(
            b.invoice_date
          ) -
          new Date(
            a.invoice_date
          )
      )

      .slice(0, 5)

      .map((invoice) => ({

        id:
          invoice.invoice_number ||
          `INV-${invoice.id}`,

        invoiceId:
          invoice.id,

        client:
          clientMap[
          invoice.client_id
          ] ||
          invoice.client_name ||
          "Unknown Client",

        amount:
          money(
            invoice.grand_total
          ),

        status:
          invoice.payment_status ||
          "unpaid",

        date:
          invoice.invoice_date,

      }));

  }, [
    invoices,
    clientMap,
  ]);


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
      <Badge
        variant={config.variant}
      >
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

      <div className="space-y-6">

        <Card className="text-center py-16">

          <p className="text-gray-500 dark:text-gray-400">

            Loading dashboard...

          </p>

        </Card>

      </div>

    );

  }
  // ==========================================================
// SEND PAYMENT REMINDER
// ==========================================================

const handleSendReminder = async () => {
  try {
    // Find invoices that still have money pending
    const pendingInvoices = invoices.filter((invoice) => {
      const paymentStatus =
        invoice.payment_status?.toLowerCase();

      return (
        invoice.status !== "cancelled" &&
        invoice.status !== "draft" &&
        ["unpaid", "partial", "overdue"].includes(paymentStatus)
      );
    });

    if (pendingInvoices.length === 0) {
      error("There are no pending invoices to send reminders for.");
      return;
    }

    // Pick the first pending invoice
    const invoice = pendingInvoices[0];

    const client = clients.find(
      (client) =>
        String(client.id) === String(invoice.client_id)
    );

    const clientEmail = client?.email;

    if (!clientEmail) {
      error(
        `No email address found for ${client?.company_name || "the client"}.`
      );
      return;
    }

    // Call backend reminder API
    await api.post(
      `/invoices/${invoice.id}/send-reminder`
    );

    // Refresh dashboard data
    await fetchDashboardData();

  } catch (err) {
    console.error(
      "FAILED TO SEND REMINDER:",
      err
    );

    console.error(
      "REMINDER RESPONSE:",
      err?.response
    );

    error(
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      "Failed to send payment reminder."
    );
  }
};


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="space-y-6">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">

            Welcome back,{" "}

            {user?.name?.split(" ")[0] ||
              "User"}!

          </h1>

          <p className="text-gray-500 dark:text-gray-400 mt-1">

            Here's what's happening with
            your business today.

          </p>

        </div>


        <div className="flex items-center gap-3">

          <Button
            variant="secondary"
            leftIcon={<FiDownload size={18} />}
            onClick={handleExportReport}
          >
            Export Report
          </Button>


          <Link to="/invoices/create">

            <Button
              leftIcon={
                <FiPlus size={18} />
              }
            >
              New Invoice
            </Button>

          </Link>

        </div>

      </div>


      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

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
            >

              <Card
                hover
                className="relative overflow-hidden"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">

                      {stat.title}

                    </p>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 break-words">

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
                    className={`p-3 rounded-xl flex-shrink-0 ${stat.color}`}
                  >

                    <stat.icon
                      size={20}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


        {/* REVENUE */}

        <Card className="lg:col-span-2">

          <Card.Header>

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
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300"
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

          </Card.Header>


          <div className="h-72">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={revenueData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -10,
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
                    fontSize: 12,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748B",
                    fontSize: 12,
                  }}
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `${value / 1000}k`
                      : value
                  }
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
                  barSize={40}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </Card>


        {/* STATUS */}

        <Card>

          <Card.Header>

            <Card.Title>
              Invoice Status
            </Card.Title>

          </Card.Header>


          <div className="h-52">

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
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
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
                    height={36}
                    formatter={(
                      value,
                      entry
                    ) => (

                      <span className="text-sm text-gray-600 dark:text-gray-400">

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


        {/* RECENT INVOICES */}

        <Card className="lg:col-span-2">

          <Card.Header>

            <Card.Title>
              Recent Invoices
            </Card.Title>

            <Link
              to="/invoices"
              className="text-sm text-primary font-medium hover:text-primary-dark"
            >
              View All
            </Link>

          </Card.Header>


          {recentInvoices.length ===
            0 ? (

            <div className="py-10 text-center">

              <p className="text-gray-500">

                No invoices yet.

              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="border-b border-gray-100 dark:border-gray-800">

                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Invoice
                    </th>

                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client
                    </th>

                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>

                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>

                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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

                        <td className="py-3 px-4">

                          <Link
                            to={`/invoices/${invoice.invoiceId}`}
                            className="text-sm font-medium text-primary hover:text-primary-dark"
                          >

                            {
                              invoice.id
                            }

                          </Link>

                        </td>


                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">

                          {
                            invoice.client
                          }

                        </td>


                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">

                          {formatCurrency(
                            invoice.amount
                          )}

                        </td>


                        <td className="py-3 px-4">

                          {getStatusBadge(
                            invoice.status
                          )}

                        </td>


                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">

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

        <Card>

          <Card.Header>

            <Card.Title>
              Recent Activity
            </Card.Title>

          </Card.Header>


          <div className="space-y-4">

            {recentInvoices
              .slice(0, 5)
              .map(
                (
                  invoice,
                  index
                ) => (

                  <div
                    key={
                      invoice.invoiceId
                    }
                    className="flex items-start gap-3"
                  >

                    <div
                      className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${invoice.status ===
                          "paid"
                          ? "bg-green-500"
                          : invoice.status ===
                            "partial"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }`}
                    />

                    <div className="flex-1 min-w-0">

                      <p className="text-sm text-gray-700 dark:text-gray-300">

                        Invoice{" "}
                        <span className="font-medium">

                          {
                            invoice.id
                          }

                        </span>{" "}

                        for{" "}

                        {
                          invoice.client
                        }

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {[

          {
            icon: FiFileText,
            label: "View Invoices",
            to: "/invoices",
          },

          {
            icon: FiUsers,
            label: "Manage Clients",
            to: "/clients",
          },

          {
            icon: FiSend,
            label: "Send Reminder",
            to: "/invoices",
          },

          {
            icon: FiTrendingUp,
            label: "View Reports",
            to: "/reports",
          },

        ].map(
          (action, index) => (

            <Link
              key={index}
              to={action.to}
            >

              <Card
                hover
                className="flex items-center gap-4 cursor-pointer group"
              >

                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-primary group-hover:text-white transition-colors">

                  <action.icon
                    size={20}
                  />

                </div>

                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">

                  {action.label}

                </span>

              </Card>

            </Link>

          )
        )}

      </div>

    </div>

  );

};


export default Dashboard;