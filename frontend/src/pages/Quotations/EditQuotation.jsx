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
    client.businessName,
    client.contact_person,
    client.contactPerson
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

const getProductDescription = (product) => {
  if (!product) {
    return "";
  }

  return firstValue(
    product.description,
    product.product_description,
    product.productDescription
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
   NORMALIZE QUOTATION ITEM
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

  const productDescription = firstValue(
    item?.description,
    item?.product_description,
    item?.productDescription,
    item?.product?.description,
    ""
  );

  return {
    id:
      item?.id ||
      `existing-${index}-${Date.now()}`,

    productId,

    productName,

    productDescription,

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
   MAIN COMPONENT
========================================================= */

const EditQuotation = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { success, error } = useToast();

  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [quotation, setQuotation] = useState(null);

  const [client, setClient] = useState(null);

  const [products, setProducts] = useState([]);

  const [quotationNumber, setQuotationNumber] =
    useState("");

  const [quotationDate, setQuotationDate] =
    useState("");

  const [validUntil, setValidUntil] =
    useState("");

  const [currency, setCurrency] =
    useState("INR");

  const [discount, setDiscount] =
    useState(0);

  const [notes, setNotes] =
    useState("");

  const [terms, setTerms] =
    useState("");

  const [items, setItems] = useState([
    createEmptyItem(),
  ]);

  /* =======================================================
     LOAD QUOTATION + CLIENT + PRODUCTS
  ======================================================= */

  useEffect(() => {
    if (!id) {
      error("Quotation ID is missing");
      navigate("/quotations");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        /* -----------------------------------------------
           LOAD QUOTATION
        ------------------------------------------------ */

        const quotationResponse =
          await api.quotations.get(id);

        const rawQuotation =
          quotationResponse?.data?.quotation ||
          quotationResponse?.data;

        if (!rawQuotation) {
          error("Quotation not found");
          navigate("/quotations");
          return;
        }

        setQuotation(rawQuotation);

        /* -----------------------------------------------
           QUOTATION NUMBER
        ------------------------------------------------ */

        setQuotationNumber(
          firstValue(
            rawQuotation.quotation_number,
            rawQuotation.quotationNumber,
            rawQuotation.number,
            `QT-${rawQuotation.id}`
          )
        );

        /* -----------------------------------------------
           QUOTATION DATE
        ------------------------------------------------ */

        setQuotationDate(
          formatDateForInput(
            firstValue(
              rawQuotation.quotation_date,
              rawQuotation.quotationDate,
              rawQuotation.created_at
            )
          )
        );

        /* -----------------------------------------------
           VALID UNTIL
        ------------------------------------------------ */

        setValidUntil(
          formatDateForInput(
            firstValue(
              rawQuotation.valid_until,
              rawQuotation.validUntil
            )
          )
        );

        /* -----------------------------------------------
           CURRENCY
        ------------------------------------------------ */

        setCurrency(
          firstValue(
            rawQuotation.currency,
            "INR"
          )
        );

        /* -----------------------------------------------
           DISCOUNT
        ------------------------------------------------ */

        setDiscount(
          numberValue(
            rawQuotation.discount,
            0
          )
        );

        /* -----------------------------------------------
           NOTES
        ------------------------------------------------ */

        setNotes(
          firstValue(
            rawQuotation.notes,
            ""
          )
        );

        /* -----------------------------------------------
           TERMS
        ------------------------------------------------ */

        setTerms(
          firstValue(
            rawQuotation.terms,
            ""
          )
        );

        /* -----------------------------------------------
           ITEMS
        ------------------------------------------------ */

        const rawItems =
          rawQuotation.items ||
          rawQuotation.quotation_items ||
          rawQuotation.quotationItems ||
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
          setItems([
            createEmptyItem(),
          ]);
        }

        /* -----------------------------------------------
           CLIENT
        ------------------------------------------------ */

        const clientId = firstValue(
          rawQuotation.client_id,
          rawQuotation.clientId,
          rawQuotation.client?.id
        );

        const embeddedClient =
          rawQuotation.client ||
          rawQuotation.client_details;

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
          "FAILED TO LOAD EDIT QUOTATION:",
          err
        );

        error(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to load quotation"
        );

        navigate("/quotations");
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
      quotation?.client_name,
      quotation?.clientName,
      quotation?.client?.company_name,
      quotation?.client?.companyName,
      quotation?.client?.name,
      quotation?.client?.contact_person,
      "Client"
    );
  }, [client, quotation]);

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

          productDescription:
            getProductDescription(product),

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
        return [
          createEmptyItem(),
        ];
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
     DISCOUNT
  ======================================================= */

  const discountValue = useMemo(() => {
    const value =
      Number(discount) || 0;

    return Math.max(
      0,
      Math.min(
        value,
        subtotal
      )
    );
  }, [discount, subtotal]);

  /* =======================================================
     TAXABLE AMOUNT
  ======================================================= */

  const taxableAmount = useMemo(() => {
    return Math.max(
      0,
      subtotal - discountValue
    );
  }, [
    subtotal,
    discountValue,
  ]);

  /* =======================================================
     TAX TOTAL
     GST IS CALCULATED AFTER DISCOUNT
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

        /* ---------------------------------------------
           Allocate discount proportionally
        --------------------------------------------- */

        const itemDiscount =
          subtotal > 0
            ? (itemSubtotal / subtotal) *
            discountValue
            : 0;

        const itemTaxableAmount =
          Math.max(
            0,
            itemSubtotal -
            itemDiscount
          );

        const itemTax =
          (itemTaxableAmount *
            taxRate) /
          100;

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
     SAVE
  ======================================================= */

  const handleSave = async () => {
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
          "Please add at least one valid quotation item"
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
           * Keep existing quotation item ID.
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
         PAYLOAD
      ------------------------------------------------ */

      const payload = {
        quotation_date:
          quotationDate,

        valid_until:
          validUntil || null,

        discount:
          discountValue,

        notes:
          notes?.trim() || null,

        terms:
          terms?.trim() || null,

        items:
          cleanedItems,
      };

      console.log(
        "UPDATING QUOTATION:",
        payload
      );

      await api.quotations.update(
        id,
        payload
      );

      /*
       * Tell Quotation History that
       * quotation was updated.
       */

      window.dispatchEvent(
        new Event("quotationUpdated")
      );

      success(
        "Quotation updated successfully"
      );

      navigate(
        `/quotations/${id}/view`
      );
    } catch (err) {
      console.error(
        "FAILED TO UPDATE QUOTATION:",
        err
      );

      error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to update quotation"
      );
    } finally {
      setSaving(false);
    }
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
            Loading quotation...
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
                `/quotations/${id}/view`
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
              Edit Quotation
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update quotation details
            </p>

          </div>

        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
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

      <Card className="p-6">

        <div className="flex items-center gap-2 mb-6">

          <FiFileText className="text-primary" />

          <h2 className="text-lg font-semibold">
            Quotation Information
          </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* QUOTATION NUMBER */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quotation Number
            </label>

            <input
              type="text"
              value={quotationNumber}
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

          {/* QUOTATION DATE */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quotation Date
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
                value={quotationDate}
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

          {/* VALID UNTIL */}

          <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valid Until
            </label>

            <input
              type="date"
              value={validUntil}
              onChange={(event) =>
                setValidUntil(
                  event.target.value
                )
              }
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
              Quotation Items
            </h2>

          </div>

          <Button
            variant="secondary"
            onClick={addItem}
            leftIcon={<FiPlus />}
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

                        {products.map(
                          (product) => {

                            const isSelected =
                              String(product.id) ===
                              String(item.productId);

                            return (
                              <option
                                key={product.id}
                                value={product.id}
                              >
                                {isSelected &&
                                  item.productName
                                  ? item.productName
                                  : getProductName(
                                    product
                                  )}
                              </option>
                            );
                          }
                        )}

                      </select>

                      {item.productDescription && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-4 max-w-[300px]">
                          {item.productDescription}
                        </p>
                      )}

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

                      {item.taxAmount > 0 && (
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
              `/quotations/${id}/view`
            )
          }
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving}
          leftIcon={<FiSave />}
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </Button>

      </div>

    </div>
  );
};

export default EditQuotation;