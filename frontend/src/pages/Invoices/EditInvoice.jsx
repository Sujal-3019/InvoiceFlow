import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiPlus,
  FiTrash2,
  FiCalendar,
  FiFileText,
  FiUser,
  FiPackage,
  FiCreditCard,
} from "react-icons/fi";

import { api } from "../../utils/axiosInstance";
import { useToast } from "../../context/ToastContext";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

/* =========================================================
   HELPERS
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
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      const number = Number(value);

      if (!Number.isNaN(number)) {
        return number;
      }
    }
  }

  return 0;
};

const formatCurrency = (amount, currency = "INR") => {
  const value = Number(amount) || 0;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || "INR"} ${value.toFixed(2)}`;
  }
};

const formatDateForInput = (date) => {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date).slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
};

/* =========================================================
   CLIENT HELPERS
========================================================= */

const getClientName = (client) => {
  if (!client) {
    return "";
  }

  return firstValue(
    client.company_name,
    client.companyName,
    client.client_name,
    client.clientName,
    client.name,
    client.business_name,
    client.businessName
  );
};

/* =========================================================
   PRODUCT HELPERS
========================================================= */

const getProductName = (product) => {
  if (!product) {
    return "";
  }

  return firstValue(
    product.name,
    product.product_name,
    product.productName,
    product.title
  );
};

const getProductPrice = (product) => {
  if (!product) {
    return 0;
  }

  return numberValue(
    product.unit_price,
    product.unitPrice,
    product.price,
    product.rate,
    product.selling_price,
    product.sellingPrice
  );
};

const getProductTax = (product) => {
  if (!product) {
    return 0;
  }

  return numberValue(
    product.gst_percent,
    product.tax_rate,
    product.taxRate,
    product.tax_percentage,
    product.taxPercentage,
    product.gst_rate,
    product.gstRate,
    product.gst_percentage,
    product.gstPercentage
  );
};

/* =========================================================
   NORMALIZE INVOICE ITEM
========================================================= */

const normalizeItem = (item, index = 0) => {
  const quantity = numberValue(
    item?.quantity,
    item?.qty,
    1
  );

  const unitPrice = numberValue(
    item?.unit_price,
    item?.unitPrice,
    item?.rate,
    item?.price,
    0
  );

  const taxRate = numberValue(
    item?.gst_percent,
    item?.tax_rate,
    item?.taxRate,
    item?.tax_percentage,
    item?.taxPercentage,
    item?.gst_rate,
    item?.gstRate,
    item?.gst_percentage,
    item?.gstPercentage,
    item?.product?.gst_percent,
    0
  );

  const productId = firstValue(
    item?.product_id,
    item?.productId,
    item?.product?.id
  );

  const productName = firstValue(
    item?.product_name,
    item?.productName,
    item?.product?.name,
    item?.name,
    item?.title,
    "Item"
  );

  return {
    id:
      item?.id ||
      `existing-${index}-${Date.now()}`,

    productId,

    productName,

    quantity: quantity > 0 ? quantity : 1,

    unitPrice,

    taxRate,
  };
};

/* =========================================================
   EMPTY ITEM
========================================================= */

const createEmptyItem = () => ({
  id: `new-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`,

  productId: "",

  productName: "",

  quantity: 1,

  unitPrice: 0,

  taxRate: 0,
});

/* =========================================================
   PAYMENT STATUS
========================================================= */

const getPaymentStatusConfig = (paymentStatus) => {
  switch (paymentStatus) {
    case "paid":
      return {
        label: "Paid",
        className:
          "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30",
        icon: "✓",
      };

    case "partial":
      return {
        label: "Partially Paid",
        className:
          "text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30",
        icon: "◐",
      };

    case "unpaid":
    default:
      return {
        label: "Unpaid",
        className:
          "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30",
        icon: "○",
      };
  }
};

/* =========================================================
   INVOICE STATUS
========================================================= */

const getInvoiceStatusConfig = (status) => {
  switch (status) {
    case "sent":
      return {
        label: "Sent",
        className:
          "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30",
        icon: "✓",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className:
          "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30",
        icon: "✕",
      };

    case "draft":
    default:
      return {
        label: "Draft",
        className:
          "text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800",
        icon: "•",
      };
  }
};
/* =========================================================
   MAIN COMPONENT
========================================================= */

const EditInvoice = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { success, error } = useToast();

  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [invoice, setInvoice] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [client, setClient] = useState(null);

  const [products, setProducts] = useState([]);

  const [invoiceNumber, setInvoiceNumber] =
    useState("");

  const [issueDate, setIssueDate] = useState("");

  const [dueDate, setDueDate] = useState("");

  const [currency, setCurrency] = useState("INR");

  const [paymentTerms, setPaymentTerms] =
    useState("");

  const [notes, setNotes] = useState("");

  const [terms, setTerms] = useState("");

  const [profile, setProfile] = useState(null);

  const [discount, setDiscount] = useState(0);


  const [invoiceStatus, setInvoiceStatus] = useState("draft");
  const originalInvoiceStatus = firstValue(
    invoice?.status,
    invoice?.invoice_status,
    "draft"
  ).toLowerCase();
  const isCancelled =
    originalInvoiceStatus === "cancelled";
  /*
   * AMOUNT PAID
   *
   * This is intentionally kept as state because
   * the user can edit it.
   */
  const [amountPaid, setAmountPaid] = useState(0);

  const [items, setItems] = useState([
    createEmptyItem(),
  ]);

  /* =======================================================
     LOAD INVOICE + CLIENT + PRODUCTS
  ======================================================= */

  useEffect(() => {
    if (!id) {
      error("Invoice ID is missing");
      navigate("/invoices");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        /* -----------------------------------------------
           LOAD INVOICE
        ------------------------------------------------ */

        const invoiceResponse =
          await api.invoices.get(id);

        const rawInvoice =
          invoiceResponse?.data?.invoice ||
          invoiceResponse?.data;

        if (!rawInvoice) {
          error("Invoice not found");
          navigate("/invoices");
          return;
        }

        setInvoice(rawInvoice);
        setInvoiceStatus(
          firstValue(
            rawInvoice.status,
            rawInvoice.invoice_status,
            "draft"
          ).toLowerCase()
        );

        /* -----------------------------------------------
           LOAD PROFILE
        ------------------------------------------------ */

        let profileData = null;

        try {
          const profileResponse =
            await api.users.getProfile();

          profileData =
            profileResponse?.data?.user ||
            profileResponse?.data;

          if (profileData) {
            setProfile(profileData);
          }
        } catch (profileError) {
          console.warn(
            "Unable to load profile:",
            profileError
          );
        }

        /* -----------------------------------------------
           INVOICE NUMBER
        ------------------------------------------------ */

        setInvoiceNumber(
          firstValue(
            rawInvoice.invoice_number,
            rawInvoice.invoiceNumber,
            rawInvoice.number,
            `INV-${rawInvoice.id}`
          )
        );

        /* -----------------------------------------------
           ISSUE DATE
        ------------------------------------------------ */

        setIssueDate(
          formatDateForInput(
            firstValue(
              rawInvoice.issue_date,
              rawInvoice.issueDate,
              rawInvoice.invoice_date,
              rawInvoice.created_at
            )
          )
        );

        /* -----------------------------------------------
           DUE DATE
        ------------------------------------------------ */

        setDueDate(
          formatDateForInput(
            firstValue(
              rawInvoice.due_date,
              rawInvoice.dueDate
            )
          )
        );

        /* -----------------------------------------------
           CURRENCY
        ------------------------------------------------ */

        setCurrency(
          firstValue(
            rawInvoice.currency,
            rawInvoice.invoice_currency,
            "INR"
          )
        );

        /* -----------------------------------------------
           PAYMENT TERMS
        ------------------------------------------------ */

        setPaymentTerms(
          firstValue(
            rawInvoice.payment_terms,
            rawInvoice.paymentTerms,
            ""
          )
        );

        /* -----------------------------------------------
           NOTES
        ------------------------------------------------ */

        setNotes(
          firstValue(
            rawInvoice.notes,
            rawInvoice.invoice_notes,
            profileData?.invoiceNotes,
            profileData?.invoice_notes,
            ""
          )
        );

        /* -----------------------------------------------
           TERMS
        ------------------------------------------------ */

        setTerms(
          firstValue(
            rawInvoice.terms,
            rawInvoice.invoice_terms,
            profileData?.invoiceTerms,
            profileData?.invoice_terms,
            ""
          )
        );

        /* -----------------------------------------------
           DISCOUNT
        ------------------------------------------------ */

        setDiscount(
          numberValue(
            rawInvoice.discount,
            rawInvoice.discount_amount,
            0
          )
        );

        /* -----------------------------------------------
           AMOUNT PAID
        ------------------------------------------------ */

        setAmountPaid(
          numberValue(
            rawInvoice.amount_paid,
            rawInvoice.amountPaid,
            rawInvoice.paid_amount,
            rawInvoice.paidAmount,
            0
          )
        );

        /* -----------------------------------------------
           ITEMS
        ------------------------------------------------ */

        const rawItems =
          rawInvoice.items ||
          rawInvoice.line_items ||
          rawInvoice.lineItems ||
          rawInvoice.invoice_items ||
          [];

        if (
          Array.isArray(rawItems) &&
          rawItems.length > 0
        ) {
          setItems(
            rawItems.map((item, index) =>
              normalizeItem(item, index)
            )
          );
        } else {
          setItems([createEmptyItem()]);
        }

        /* -----------------------------------------------
           CLIENT ID
        ------------------------------------------------ */

        const clientId = firstValue(
          rawInvoice.client_id,
          rawInvoice.clientId,
          rawInvoice.customer_id,
          rawInvoice.customerId,
          rawInvoice.client?.id,
          rawInvoice.customer?.id
        );

        /* -----------------------------------------------
           EMBEDDED CLIENT
        ------------------------------------------------ */

        const embeddedClient =
          rawInvoice.client ||
          rawInvoice.customer ||
          rawInvoice.client_details ||
          rawInvoice.customer_details;

        if (embeddedClient) {
          setClient(embeddedClient);
        }

        /* -----------------------------------------------
           FETCH CLIENT
        ------------------------------------------------ */

        if (clientId) {
          try {
            const clientResponse =
              await api.clients.get(clientId);

            const realClient =
              clientResponse?.data?.client ||
              clientResponse?.data;

            if (realClient) {
              setClient(realClient);
            }
          } catch (clientError) {
            console.warn(
              "Unable to fetch client:",
              clientError
            );
          }
        }

        /* -----------------------------------------------
           LOAD PRODUCTS
        ------------------------------------------------ */

        try {
          const productsResponse =
            await api.products.list();

          const productData =
            productsResponse?.data?.products ||
            productsResponse?.data?.items ||
            productsResponse?.data;

          if (Array.isArray(productData)) {
            setProducts(productData);
          } else {
            setProducts([]);
          }
        } catch (productError) {
          console.warn(
            "Unable to load products:",
            productError
          );

          setProducts([]);
        }
      } catch (err) {
        console.error(
          "FAILED TO LOAD EDIT INVOICE:",
          err
        );

        error(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to load invoice"
        );

        navigate("/invoices");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate, error]);

  /* =======================================================
     CLIENT DISPLAY NAME
  ======================================================= */

  const clientName = useMemo(() => {
    const name = getClientName(client);

    if (name) {
      return name;
    }

    return firstValue(
      invoice?.client_name,
      invoice?.clientName,
      invoice?.customer_name,
      invoice?.customerName,
      invoice?.client?.company_name,
      invoice?.client?.companyName,
      invoice?.client?.name,
      invoice?.customer?.company_name,
      invoice?.customer?.companyName,
      invoice?.customer?.name,
      "Client"
    );
  }, [client, invoice]);

  /* =======================================================
     UPDATE ITEM
  ======================================================= */

  const updateItem = (
    itemId,
    field,
    value
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  /* =======================================================
     PRODUCT CHANGE
  ======================================================= */

  const handleProductChange = (
    itemId,
    productId
  ) => {
    const product = products.find(
      (item) =>
        String(item.id) ===
        String(productId)
    );

    if (!product) {
      updateItem(
        itemId,
        "productId",
        productId
      );

      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,

          productId: product.id,

          productName:
            getProductName(product),

          unitPrice:
            getProductPrice(product),

          taxRate:
            getProductTax(product),
        };
      })
    );
  };

  /* =======================================================
     ADD ITEM
  ======================================================= */

  const addItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      createEmptyItem(),
    ]);
  };

  /* =======================================================
     REMOVE ITEM
  ======================================================= */

  const removeItem = (itemId) => {
    setItems((currentItems) => {
      if (currentItems.length === 1) {
        return [createEmptyItem()];
      }

      return currentItems.filter(
        (item) => item.id !== itemId
      );
    });
  };

  /* =======================================================
     CALCULATED ITEMS
  ======================================================= */

  const calculatedItems = useMemo(() => {
    return items.map((item) => {
      const quantity =
        Number(item.quantity) || 0;

      const unitPrice =
        Number(item.unitPrice) || 0;

      const taxRate =
        Number(item.taxRate) || 0;

      const amount =
        quantity * unitPrice;

      const taxAmount =
        (amount * taxRate) / 100;

      return {
        ...item,
        quantity,
        unitPrice,
        taxRate,
        amount,
        taxAmount,
      };
    });
  }, [items]);

  /* =======================================================
     SUBTOTAL
  ======================================================= */

  const subtotal = useMemo(() => {
    return calculatedItems.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    );
  }, [calculatedItems]);

  /* =======================================================
   DISCOUNT VALUE
======================================================= */

  const discountValue = useMemo(() => {
    const value = Number(discount) || 0;

    // Discount cannot be greater than subtotal
    return Math.max(
      0,
      Math.min(value, subtotal)
    );
  }, [discount, subtotal]);

  /* =======================================================
     TAXABLE AMOUNT
     GST IS CALCULATED AFTER DISCOUNT
  ======================================================= */

  const taxableAmount = useMemo(() => {
    return Math.max(
      0,
      subtotal - discountValue
    );
  }, [subtotal, discountValue]);

  /* =======================================================
     TAX TOTAL
     GST IS APPLIED ON DISCOUNTED AMOUNT
  ======================================================= */

  const taxTotal = useMemo(() => {
    if (taxableAmount <= 0) {
      return 0;
    }

    return calculatedItems.reduce(
      (sum, item) => {
        const quantity =
          Number(item.quantity) || 0;

        const unitPrice =
          Number(item.unitPrice) || 0;

        const taxRate =
          Number(item.taxRate) || 0;

        const itemSubtotal =
          quantity * unitPrice;

        // Allocate the overall discount
        // proportionally across invoice items
        const itemDiscount =
          subtotal > 0
            ? (itemSubtotal / subtotal) *
            discountValue
            : 0;

        const itemTaxableAmount =
          Math.max(
            0,
            itemSubtotal - itemDiscount
          );

        const itemTax =
          (itemTaxableAmount * taxRate) / 100;

        return sum + itemTax;
      },
      0
    );
  }, [
    calculatedItems,
    subtotal,
    discountValue,
    taxableAmount,
  ]);

  /* =======================================================
     TOTAL
  ======================================================= */

  const total = useMemo(() => {
    return Math.max(
      0,
      taxableAmount + taxTotal
    );
  }, [
    taxableAmount,
    taxTotal,
  ]);

  /* =======================================================
     NORMALIZED AMOUNT PAID
  ======================================================= */

  const normalizedAmountPaid = useMemo(() => {
    const value =
      Number(amountPaid) || 0;

    return Math.max(
      0,
      Math.min(value, total)
    );
  }, [amountPaid, total]);

  /* =======================================================
     AMOUNT DUE
  ======================================================= */

  const amountDue = useMemo(() => {
    return Math.max(
      0,
      total - normalizedAmountPaid
    );
  }, [total, normalizedAmountPaid]);

  /* =======================================================
     PAYMENT STATUS
  ======================================================= */

  const paymentStatus = useMemo(() => {
    if (total <= 0) {
      return "unpaid";
    }

    if (normalizedAmountPaid >= total) {
      return "paid";
    }

    if (normalizedAmountPaid > 0) {
      return "partial";
    }

    return "unpaid";
  }, [total, normalizedAmountPaid]);

  const paymentStatusConfig =
    getPaymentStatusConfig(
      paymentStatus
    );
  const invoiceStatusConfig =
    getInvoiceStatusConfig(invoiceStatus);

  /* =======================================================
     HANDLE AMOUNT PAID
  ======================================================= */

  const handleAmountPaidChange = (
    event
  ) => {
    const value = event.target.value;

    if (value === "") {
      setAmountPaid("");
      return;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return;
    }

    setAmountPaid(
      Math.max(
        0,
        Math.min(
          numericValue,
          total
        )
      )
    );
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const performSave = async () => {
    try {
      setSaving(true);

      /* -----------------------------------------------
         VALIDATE ITEMS
      ------------------------------------------------ */

      const validItems = items.filter(
        (item) => {
          const productId =
            Number(item.productId);

          const quantity =
            Number(item.quantity);

          return (
            item.productId !== "" &&
            item.productId !== null &&
            item.productId !== undefined &&
            !Number.isNaN(productId) &&
            productId > 0 &&
            quantity > 0
          );
        }
      );

      if (validItems.length === 0) {
        error(
          "Please add at least one valid invoice item"
        );

        setSaving(false);
        return;
      }

      /* -----------------------------------------------
         CLEAN ITEMS
      ------------------------------------------------ */

      const cleanedItems =
        validItems.map((item) => {
          const cleanedItem = {
            product_id:
              Number(item.productId),

            quantity:
              Number(item.quantity) || 1,
          };

          /*
           * Keep existing invoice item ID.
           * Do not send temporary IDs.
           */
          if (
            item.id &&
            !String(item.id).startsWith(
              "new-"
            ) &&
            !String(item.id).startsWith(
              "existing-"
            )
          ) {
            cleanedItem.id = item.id;
          }

          return cleanedItem;
        });

      /* -----------------------------------------------
         FINAL AMOUNT PAID
      ------------------------------------------------ */

      const finalAmountPaid = Math.max(
        0,
        Math.min(
          Number(amountPaid) || 0,
          total
        )
      );

      /* -----------------------------------------------
         PAYLOAD
      ------------------------------------------------ */

      const payload = {
        due_date: dueDate || null,

        discount: discountValue,

        notes: notes || null,

        terms: terms || null,

        items: cleanedItems,

        amount_paid: finalAmountPaid,

        payment_status: paymentStatus,

        status: invoiceStatus,
      };

      console.log(
        "UPDATING INVOICE:",
        payload
      );

      await api.invoices.update(
        id,
        payload
      );

      // Tell Invoice History that the invoice was updated
      window.dispatchEvent(new Event("invoiceUpdated"));


      success(
        "Invoice updated successfully"
      );

      navigate(`/invoices/${id}`);
    } catch (err) {
      console.error(
        "FAILED TO UPDATE INVOICE:",
        err
      );

      error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to update invoice"
      );
    } finally {
      setSaving(false);
    }
  };
  const handleSave = () => {
    // If invoice is already cancelled,
    // do nothing.
    if (isCancelled) {
      return;
    }

    // If user is trying to cancel the invoice,
    // show confirmation popup first.
    if (invoiceStatus === "cancelled") {
      setShowCancelConfirm(true);
      return;
    }

    // Normal save
    performSave();
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
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6 pb-12">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() =>
              navigate(
                `/invoices/${id}`
              )
            }
            className="
              p-2 rounded-xl
              border border-gray-200
              dark:border-gray-700
              hover:bg-gray-50
              dark:hover:bg-gray-800
              transition-colors
            "
          >
            <FiArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Edit Invoice
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update invoice details
            </p>
          </div>

        </div>

        <Button
          onClick={handleSave}
          disabled={saving || isCancelled}
          leftIcon={<FiSave />}
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </Button>

      </div>

      {/* =================================================
          BASIC INFORMATION
      ================================================= */}
      {isCancelled && (
        <div className="
      flex items-start gap-3
      p-4
      rounded-xl
      border border-red-200
      bg-red-50
      dark:border-red-900/50
      dark:bg-red-900/20
      text-red-700
      dark:text-red-300
      ">
          <div className="text-lg">
            ⚠
          </div>

          <div>
            <p className="font-semibold">
              This invoice is cancelled
            </p>

            <p className="text-sm mt-1">
              Cancelled invoices are view-only and
              cannot be modified.
            </p>
          </div>
        </div>
      )}
      <Card className="p-6">

        <div className="flex items-center gap-2 mb-6">

          <FiFileText className="text-primary" />

          <h2 className="text-lg font-semibold">
            Invoice Information
          </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* INVOICE NUMBER */}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invoice Number
            </label>

            <input
              type="text"
              value={invoiceNumber}
              readOnly
              disabled
              className="
                w-full px-4 py-2.5 rounded-xl
                border border-gray-200
                dark:border-gray-700
                bg-gray-100
                dark:bg-gray-800
                text-gray-700
                dark:text-gray-300
                cursor-not-allowed
              "
            />
          </div>

          {/* ISSUE DATE */}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Issue Date
            </label>

            <div className="relative">

              <FiCalendar
                className="
                  absolute left-3 top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                type="date"
                value={issueDate}
                readOnly
                disabled
                className="
                  w-full pl-10 pr-4 py-2.5
                  rounded-xl
                  border border-gray-200
                  dark:border-gray-700
                  bg-gray-100
                  dark:bg-gray-800
                  text-gray-700
                  dark:text-gray-300
                  cursor-not-allowed
                "
              />

            </div>
          </div>

          {/* CLIENT */}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Client
            </label>

            <div className="relative">

              <FiUser
                className="
                  absolute left-3 top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                type="text"
                value={clientName}
                readOnly
                disabled
                className="
                  w-full pl-10 pr-4 py-2.5
                  rounded-xl
                  border border-gray-200
                  dark:border-gray-700
                  bg-gray-100
                  dark:bg-gray-800
                  text-gray-700
                  dark:text-gray-300
                  cursor-not-allowed
                "
              />

            </div>
          </div>

          {/* DUE DATE */}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Date
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(
                  event.target.value
                )
              }
              disabled={isCancelled}
              className="
                w-full px-4 py-2.5
                rounded-xl
                border border-gray-200
                dark:border-gray-700
                bg-white
                dark:bg-dark-card
                text-gray-900
                dark:text-gray-100
              "
            />
          </div>

          {/* CURRENCY */}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency
            </label>

            <select
              value={currency}
              disabled
              className="
                w-full px-4 py-2.5
                rounded-xl
                border border-gray-200
                dark:border-gray-700
                bg-gray-100
                dark:bg-gray-800
                text-gray-500
                dark:text-gray-400
                cursor-not-allowed
              "
            >
              <option value="INR">
                INR - Indian Rupee
              </option>

              <option value="USD">
                USD - US Dollar
              </option>

              <option value="EUR">
                EUR - Euro
              </option>

              <option value="GBP">
                GBP - British Pound
              </option>
            </select>
          </div>

          {/* PAYMENT TERMS */}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Terms
            </label>

            <input
              type="text"
              value={paymentTerms}
              readOnly
              disabled
              placeholder="Payment terms"
              className="
                w-full px-4 py-2.5
                rounded-xl
                border border-gray-200
                dark:border-gray-700
                bg-gray-100
                dark:bg-gray-800
                text-gray-500
                dark:text-gray-400
                cursor-not-allowed
              "
            />
          </div>
          {/* INVOICE STATUS */}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invoice Status
            </label>

            <select
              value={invoiceStatus}
              onChange={(event) =>
                setInvoiceStatus(event.target.value)
              }
              disabled={isCancelled}
              className="
      w-full px-4 py-2.5 rounded-xl
      border border-gray-200
      dark:border-gray-700
      bg-white dark:bg-dark-card
       text-gray-900 dark:text-gray-100
     "
            >
              <option value="draft">
                Draft
              </option>

              <option value="sent">
                Sent
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>

            <div className="mt-2">
              <span
                className={`
        inline-flex
        items-center
        px-3 py-1
        rounded-full
        text-xs
        font-semibold
        ${invoiceStatusConfig.className}
      `}
              >
                {invoiceStatusConfig.label}
              </span>
            </div>
          </div>

        </div>
      </Card>

      {/* =================================================
          ITEMS + TOTALS
      ================================================= */}

      <Card className="p-6">

        <div className="flex items-center justify-between mb-6">

          <div className="flex items-center gap-2">

            <FiPackage className="text-primary" />

            <h2 className="text-lg font-semibold">
              Invoice Items
            </h2>

          </div>

          <Button
            variant="secondary"
            onClick={addItem}
            leftIcon={<FiPlus />}
            disabled={isCancelled}
          >
            Add Item
          </Button>

        </div>

        {/* ITEMS TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px]">

            <thead>

              <tr className="border-y border-gray-200 dark:border-gray-700">

                <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  #
                </th>

                <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Item
                </th>

                <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Qty
                </th>

                <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Rate
                </th>

                <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tax %
                </th>

                <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Amount
                </th>

                <th className="w-12" />

              </tr>

            </thead>

            <tbody>

              {calculatedItems.map(
                (item, index) => (
                  <tr
                    key={item.id}
                    className="
                      border-b
                      border-gray-100
                      dark:border-gray-800
                    "
                  >

                    {/* NUMBER */}

                    <td className="py-4 px-3 text-sm text-gray-500">
                      {index + 1}
                    </td>

                    {/* PRODUCT */}

                    <td className="py-4 px-3">

                      <select
                        value={
                          item.productId || ""
                        }
                        onChange={(event) =>
                          handleProductChange(
                            item.id,
                            event.target.value
                          )
                        }
                        disabled={isCancelled}
                        className="
                          w-full min-w-[220px]
                          px-3 py-2
                          rounded-lg
                          border border-gray-200
                          dark:border-gray-700
                          bg-white
                          dark:bg-dark-card
                          text-gray-900
                          dark:text-gray-100
                        "
                      >

                        <option value="">
                          Select item
                        </option>
                        {products.map((product) => {
                          const isSelected =
                            String(product.id) ===
                            String(item.productId);

                          return (
                            <option
                              key={product.id}
                              value={product.id}
                            >
                              {isSelected && item.productName
                                ? item.productName
                                : getProductName(product)}
                            </option>
                          );
                        })}

                      </select>

                    </td>

                    {/* QUANTITY */}

                    <td className="py-4 px-3">

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          item.quantity
                        }
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            "quantity",
                            event.target.value
                          )
                        }
                        disabled={isCancelled}
                        className="
                          w-24 px-3 py-2
                          rounded-lg
                          border border-gray-200
                          dark:border-gray-700
                          bg-white
                          dark:bg-dark-card
                          text-right
                        "
                      />

                    </td>

                    {/* RATE */}

                    <td className="py-4 px-3">

                      <input
                        type="number"
                        value={
                          item.unitPrice
                        }
                        readOnly
                        disabled
                        className="
                          w-32 px-3 py-2
                          rounded-lg
                          border border-gray-200
                          dark:border-gray-700
                          bg-gray-100
                          dark:bg-gray-800
                          text-gray-500
                          dark:text-gray-400
                          text-right
                          cursor-not-allowed
                        "
                      />

                    </td>

                    {/* TAX */}

                    <td className="py-4 px-3">

                      <input
                        type="number"
                        value={
                          item.taxRate
                        }
                        readOnly
                        disabled
                        className="
                          w-24 px-3 py-2
                          rounded-lg
                          border border-gray-200
                          dark:border-gray-700
                          bg-gray-100
                          dark:bg-gray-800
                          text-gray-500
                          dark:text-gray-400
                          text-right
                          cursor-not-allowed
                        "
                      />

                    </td>

                    {/* AMOUNT */}

                    <td className="py-4 px-3 text-right">

                      <div className="font-medium text-gray-900 dark:text-gray-100">

                        {formatCurrency(
                          item.amount,
                          currency
                        )}

                      </div>

                      {item.taxAmount >
                        0 && (
                          <div className="text-xs text-gray-500 mt-1">

                            Tax:{" "}

                            {formatCurrency(
                              item.taxAmount,
                              currency
                            )}

                          </div>
                        )}

                    </td>

                    {/* DELETE */}

                    <td className="py-4 px-3">

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(
                            item.id
                          )
                        }
                        disabled={isCancelled}
                        className="
                          p-2 rounded-lg
                          text-red-500
                          hover:bg-red-50
                          dark:hover:bg-red-900/20
                        "
                        title="Remove item"
                      >
                        <FiTrash2
                          size={17}
                        />
                      </button>

                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

        {/* =================================================
            TOTALS
        ================================================= */}

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">

          <div className="flex flex-col lg:flex-row lg:justify-between gap-8">

            {/* LEFT */}

            <div className="flex-1 max-w-xl">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* DISCOUNT */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(event) =>
                      setDiscount(
                        event.target.value
                      )
                    }
                    disabled={isCancelled}
                    className="
                      no-spinner
                      w-full px-4 py-2.5
                      rounded-xl
                      border border-gray-200
                      dark:border-gray-700
                      bg-white
                      dark:bg-dark-card
                      text-gray-900
                      dark:text-gray-100
                    "
                  />

                </div>

              </div>

            </div>

            {/* RIGHT */}

            <div className="w-full lg:w-96 space-y-3">

              {/* SUBTOTAL */}

              <div className="flex justify-between text-sm">

                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-medium">

                  {formatCurrency(
                    subtotal,
                    currency
                  )}

                </span>

              </div>

              {/* DISCOUNT */}

              {discountValue > 0 && (
                <div className="flex justify-between text-sm">

                  <span className="text-gray-500">
                    Discount
                  </span>

                  <span className="font-medium text-green-600">

                    -
                    {formatCurrency(
                      discountValue,
                      currency
                    )}

                  </span>

                </div>
              )}

              {/* TAX */}

              <div className="flex justify-between text-sm">

                <span className="text-gray-500">
                  Tax
                </span>

                <span className="font-medium">

                  {formatCurrency(
                    taxTotal,
                    currency
                  )}

                </span>

              </div>

              {/* TOTAL */}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-end">

                <span className="text-lg font-semibold">
                  Total
                </span>

                <span className="text-2xl font-bold text-primary">

                  {formatCurrency(
                    total,
                    currency
                  )}

                </span>

              </div>

            </div>

          </div>

        </div>

      </Card>

      {/* =================================================
          PAYMENT INFORMATION
      ================================================= */}

      <Card className="p-6">

        <div className="flex items-center gap-2 mb-6">

          <FiCreditCard className="text-primary" />

          <h2 className="text-lg font-semibold">
            Payment Information
          </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* TOTAL */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invoice Total
            </label>

            <div className="
              w-full px-4 py-2.5
              rounded-xl
              border border-gray-200
              dark:border-gray-700
              bg-gray-100
              dark:bg-gray-800
              font-semibold
            ">

              {formatCurrency(
                total,
                currency
              )}

            </div>

          </div>

          {/* AMOUNT PAID */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount Paid
            </label>

            <input
              type="number"
              min="0"
              max={total}
              step="0.01"
              value={amountPaid}
              onChange={
                handleAmountPaidChange
              }
              disabled={isCancelled}
              className="
                w-full px-4 py-2.5
                rounded-xl
                border border-gray-200
                dark:border-gray-700
                bg-white
                dark:bg-dark-card
                text-gray-900
                dark:text-gray-100
              "
            />

            <p className="text-xs text-gray-500 mt-1">
              Maximum:{" "}
              {formatCurrency(
                total,
                currency
              )}
            </p>

          </div>

          {/* AMOUNT DUE */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount Due
            </label>

            <div className="
              w-full px-4 py-2.5
              rounded-xl
              border border-gray-200
              dark:border-gray-700
              bg-gray-100
              dark:bg-gray-800
              font-semibold
            ">

              {formatCurrency(
                amountDue,
                currency
              )}

            </div>

          </div>

        </div>

        {/* PAYMENT STATUS */}

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>

            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Status
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Status is calculated automatically from the amount paid.
            </p>

          </div>

          <div
            className={`
              inline-flex
              items-center
              gap-2
              px-4
              py-2
              rounded-full
              text-sm
              font-semibold
              ${paymentStatusConfig.className}
            `}
          >

            <span>
              {paymentStatusConfig.icon}
            </span>

            <span>
              {paymentStatusConfig.label}
            </span>

          </div>

        </div>

        {/* PAYMENT SUMMARY */}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4">

            <p className="text-xs text-gray-500">
              Total
            </p>

            <p className="mt-1 text-lg font-bold">
              {formatCurrency(
                total,
                currency
              )}
            </p>

          </div>

          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-4">

            <p className="text-xs text-gray-500">
              Paid
            </p>

            <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(
                normalizedAmountPaid,
                currency
              )}
            </p>

          </div>

          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4">

            <p className="text-xs text-gray-500">
              Due
            </p>

            <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">
              {formatCurrency(
                amountDue,
                currency
              )}
            </p>

          </div>

        </div>

      </Card>

      {/* =================================================
          NOTES + TERMS
      ================================================= */}

      <Card className="p-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* NOTES */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>

            <textarea
              rows={5}
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              disabled={isCancelled}
              placeholder="Add notes..."
              className="
                w-full px-4 py-3
                rounded-xl
                border border-gray-200
                dark:border-gray-700
                bg-white
                dark:bg-dark-card
                text-gray-900
                dark:text-gray-100
                resize-none
              "
            />

          </div>

          {/* TERMS */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Terms & Conditions
            </label>

            <textarea
              rows={5}
              value={terms}
              onChange={(event) =>
                setTerms(
                  event.target.value
                )
              }
              disabled={isCancelled}
              placeholder="Add terms and conditions..."
              className="
                w-full px-4 py-3
                rounded-xl
                border border-gray-200
                dark:border-gray-700
                bg-white
                dark:bg-dark-card
                text-gray-900
                dark:text-gray-100
                resize-none
              "
            />

          </div>

        </div>

      </Card>

      {/* =================================================
          BOTTOM ACTIONS
      ================================================= */}

      <div className="flex justify-end gap-3">

        <Button
          variant="secondary"
          onClick={() =>
            navigate(
              `/invoices/${id}`
            )
          }
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving || isCancelled}
          leftIcon={<FiSave />}
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </Button>

      </div>
      {/* =================================================
    CANCEL INVOICE CONFIRMATION MODAL
================================================= */}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">

          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCancelConfirm(false)}
          />

          {/* MODAL */}
          <div className="
      relative
      w-full
      max-w-md
      rounded-2xl
      bg-white
      dark:bg-gray-900
      shadow-2xl
      border
      border-gray-200
      dark:border-gray-700
      p-6
    ">

            {/* ICON */}
            <div className="
        mx-auto
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-full
        bg-red-100
        dark:bg-red-900/30
        text-red-600
        dark:text-red-400
        text-xl
      ">
              ⚠
            </div>

            {/* TITLE */}
            <h3 className="
        mt-4
        text-lg
        font-semibold
        text-center
        text-gray-900
        dark:text-gray-100
      ">
              Cancel Invoice?
            </h3>

            {/* MESSAGE */}
            <p className="
        mt-3
        text-sm
        leading-6
        text-center
        text-gray-600
        dark:text-gray-400
      ">
              You have set this invoice status to
              <span className="font-semibold text-red-600 dark:text-red-400">
                {" "}Cancelled
              </span>.
              Cancelled invoices cannot be edited afterward.
            </p>

            <p className="
        mt-2
        text-sm
        text-center
        text-gray-500
        dark:text-gray-400
      ">
              Are you sure you want to continue?
            </p>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6">

              {/* CANCEL */}
              <Button
                variant="secondary"
                onClick={() => setShowCancelConfirm(false)}
                disabled={saving}
              >
                Go Back
              </Button>

              {/* CONFIRM */}
              <Button
                onClick={async () => {
                  setShowCancelConfirm(false);
                  await performSave();
                }}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {saving
                  ? "Cancelling..."
                  : "Save & Cancel Invoice"}
              </Button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default EditInvoice;