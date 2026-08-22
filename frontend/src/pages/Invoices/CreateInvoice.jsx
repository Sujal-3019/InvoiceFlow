import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiFileText,
  FiImage,
  FiPlus,
  FiSave,
  FiSend,
  FiTrash2,
  FiUserPlus,
  FiX,
} from 'react-icons/fi';
import { api } from '../../utils/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { useProfile } from "../../context/ProfileContext";
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

import {
  formatCurrency,
  formatDate,
  calculateInvoiceTotals,
} from '../../utils/helper';


/* =========================================================
   ERROR HELPER
========================================================= */

const getApiErrorMessage = (
  err,
  fallback = 'Something went wrong'
) => {
  const detail = err?.response?.data?.detail;

  if (!detail) {
    return (
      err?.response?.data?.message ||
      err?.message ||
      fallback
    );
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item?.msg) {
          const location = Array.isArray(item.loc)
            ? item.loc.join(' → ')
            : '';

          return location
            ? `${location}: ${item.msg}`
            : item.msg;
        }

        return 'Invalid input';
      })
      .filter(Boolean)
      .join(', ');
  }

  if (typeof detail === 'object') {
    return (
      detail.msg ||
      detail.message ||
      'Invalid request'
    );
  }

  return String(detail);
};

/* =========================================================
   BACKEND FILE URL HELPER
========================================================= */

const getBackendFileUrl = (url) => {
  if (!url) {
    return '';
  }

  /*
   * If the backend already returned a complete URL,
   * use it exactly as provided.
   */
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  /*
   * Relative backend paths such as:
   *
   * /uploads/logos/example.png
   *
   * must be loaded from FastAPI rather than Vite.
   */
  const apiBaseUrl =
    import.meta.env.VITE_API_URL ||
    'http://localhost:8000';

  return `${apiBaseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

/* =========================================================
   INITIAL DATA
========================================================= */

const createEmptyItem = () => ({
  id: `item-${Date.now()}-${Math.random()}`,
  productId: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  tax: 0,
});


const initialNewClient = {
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  gst_number: '',
  address: '',
};


/* =========================================================
   COMPONENT
========================================================= */

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { profile } = useProfile();

  const previewRef = useRef(null);
  const logoInputRef = useRef(null);

  /* -------------------------------------------------------
     DATA
  ------------------------------------------------------- */

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const [loadingInvoiceNumber, setLoadingInvoiceNumber] = useState(true);
  /* -------------------------------------------------------
     CLIENT DROPDOWN
  ------------------------------------------------------- */

  const [showClientDropdown, setShowClientDropdown] =
    useState(false);

  const [clientSearch, setClientSearch] = useState('');

  /* -------------------------------------------------------
     ADD CLIENT MODAL
  ------------------------------------------------------- */

  const [showAddClientModal, setShowAddClientModal] =
    useState(false);

  const [creatingClient, setCreatingClient] =
    useState(false);

  const [newClient, setNewClient] =
    useState(initialNewClient);

  const [phoneCountry, setPhoneCountry] = useState("IN");
  const [phoneError, setPhoneError] = useState("");

  /* -------------------------------------------------------
     add new product
  ------------------------------------------------------- */

  const initialNewProduct = {
    name: '',
    description: '',
    price: '',
    gst_percent: '18',
  };

  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState(initialNewProduct);
  const [activeItemId, setActiveItemId] = useState(null);

  /* -------------------------------------------------------
     PREVIEW
  ------------------------------------------------------- */

  const [showPreview, setShowPreview] =
    useState(false);

  /* -------------------------------------------------------
     Profile State
  ------------------------------------------------------- */
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLogoUrl, setProfileLogoUrl] = useState('');

  useEffect(() => {
    if (!profile) return;

    setFormData((prev) => ({
      ...prev,

      currency:
        profile.currency || prev.currency,

      company: {
        ...prev.company,

        name:
          profile.business_name ||
          profile.businessName ||
          profile.company ||
          prev.company.name,

        email:
          profile.email ||
          prev.company.email,

        phone:
          profile.phone ||
          prev.company.phone,

        address:
          profile.address ||
          prev.company.address,

        city:
          profile.city ||
          prev.company.city,

        state:
          profile.state ||
          prev.company.state,

        zip:
          profile.zip ||
          prev.company.zip,

        country:
          profile.country ||
          prev.company.country,

        taxId:
          profile.gstNumber ||
          profile.gst_number ||
          profile.taxId ||
          prev.company.taxId,
      },

      notes:
        profile.invoiceNotes ||
        profile.invoice_notes ||
        prev.notes,

      terms:
        profile.invoiceTerms ||
        profile.invoice_terms ||
        prev.terms,
    }));
  }, [profile]);

  useEffect(() => {
    if (!profile) return;

    const logo =
      profile.business_logo ||
      profile.businessLogo ||
      profile.logo_url ||
      profile.logoUrl ||
      profile.company_logo ||
      profile.companyLogo ||
      profile.logo;

    if (!logo) {
      setCompanyLogoUrl('');
      return;
    }

    const logoUrl = getBackendFileUrl(logo);

    setCompanyLogoUrl(logoUrl);
  }, [profile]);

  useEffect(() => {
    const loadNextInvoiceNumber = async () => {
      try {
        setLoadingInvoiceNumber(true);

        const response = await api.invoices.nextNumber();

        const nextInvoiceNumber =
          response?.data?.invoiceNumber ||
          response?.data?.invoice_number;

        if (!nextInvoiceNumber) {
          throw new Error(
            'Server did not return the next invoice number.'
          );
        }

        setFormData((prev) => ({
          ...prev,
          invoiceNumber: nextInvoiceNumber,
        }));
      } catch (err) {
        console.error(
          'Failed to load next invoice number:',
          err
        );

        error(
          getApiErrorMessage(
            err,
            'Failed to generate invoice number'
          )
        );
      } finally {
        setLoadingInvoiceNumber(false);
      }
    };

    loadNextInvoiceNumber();
  }, [error]);

  /* -------------------------------------------------------
     COMPANY LOGO
  ------------------------------------------------------- */

  const [companyLogo, setCompanyLogo] =
    useState(null);

  const [companyLogoUrl, setCompanyLogoUrl] =
    useState('');

  /* -------------------------------------------------------
     FORM
  ------------------------------------------------------- */

  const [formData, setFormData] = useState({
    invoiceNumber: '',

    invoiceDate:
      new Date().toISOString().split('T')[0],

    dueDate: '',

    currency: 'INR',

    /* -----------------------------------------------
       YOUR COMPANY
    ----------------------------------------------- */

    company: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'India',
      taxId: '',
    },

    /* -----------------------------------------------
       CLIENT
    ----------------------------------------------- */

    clientId: '',

    client: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      taxId: '',
    },

    /* -----------------------------------------------
       ITEMS
    ----------------------------------------------- */

    items: [createEmptyItem()],

    /* -----------------------------------------------
       SUMMARY
    ----------------------------------------------- */

    discount: 0,
    discountType: 'fixed',

    notes: '',

    terms: '',
  });

  const [amountPaid, setAmountPaid] = useState(0);


  /* =========================================================
     LOAD CLIENTS + PRODUCTS
  ========================================================= */

  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        setLoadingData(true);

        const [
          clientsResponse,
          productsResponse,
        ] = await Promise.all([
          api.clients.list(),
          api.products.list(),
        ]);

        setClients(
          Array.isArray(clientsResponse?.data)
            ? clientsResponse.data
            : []
        );

        setProducts(
          Array.isArray(productsResponse?.data)
            ? productsResponse.data
            : []
        );
      } catch (err) {
        console.error(
          'Failed to load invoice data:',
          err
        );

        error(
          getApiErrorMessage(
            err,
            'Failed to load clients and products'
          )
        );
      } finally {
        setLoadingData(false);
      }
    };

    loadInvoiceData();
  }, [error]);


  /* =========================================================
     CLEANUP LOGO OBJECT URL
  ========================================================= */

  useEffect(() => {
    return () => {
      if (companyLogoUrl) {
        URL.revokeObjectURL(companyLogoUrl);
      }
    };
  }, [companyLogoUrl]);


  /* =========================================================
     CLIENT HELPERS
  ========================================================= */

  const getClientName = (client) => {
    if (!client) {
      return '';
    }

    return (
      client.company ||
      client.company_name ||
      client.contact_person ||
      'Unnamed Client'
    );
  };


  const getClientEmail = (client) => {
    return client?.email || '';
  };

  const getProductName = (item) => {
    if (!item?.productId) {
      return 'Product';
    }

    const product = products.find(
      (product) =>
        String(product.id) ===
        String(item.productId)
    );

    return product?.name || 'Product';
  };



  const filteredClients = useMemo(() => {
    const search =
      clientSearch.trim().toLowerCase();

    if (!search) {
      return clients;
    }

    return clients.filter((client) => {
      const companyName =
        client.company_name?.toLowerCase() || client.company_name?.toLowerCase() || '';

      const contactPerson =
        client.contact_person?.toLowerCase() || '';

      const email =
        client.email?.toLowerCase() || '';

      const phone =
        client.phone?.toLowerCase() || '';

      return (
        companyName.includes(search) ||
        contactPerson.includes(search) ||
        email.includes(search) ||
        phone.includes(search)
      );
    });
  }, [clients, clientSearch]);


  /* =========================================================
     FORM HELPERS
  ========================================================= */

  const handleCompanyChange = (
    field,
    value
  ) => {
    setFormData((prev) => ({
      ...prev,

      company: {
        ...prev.company,
        [field]: value,
      },
    }));
  };


  const handleClientChange = (
    field,
    value
  ) => {
    setFormData((prev) => ({
      ...prev,

      client: {
        ...prev.client,
        [field]: value,
      },
    }));
  };


  /* =========================================================
     SELECT CLIENT
  ========================================================= */

  const handleClientSelect = (client) => {
    if (!client) {
      return;
    }

    setFormData((prev) => ({
      ...prev,

      clientId: String(client.id),

      client: {
        name:
          client.company_name ||
          client.contact_person ||
          '',

        email: client.email || '',

        phone: client.phone || '',

        address: client.address || '',

        city: client.city || '',

        state: client.state || '',

        zip: client.zip || '',

        country: client.country || '',

        taxId:
          client.gst_number ||
          client.tax_id ||
          client.taxId ||
          '',
      },
    }));

    setShowClientDropdown(false);
    setClientSearch('');
  };


  /* =========================================================
     ADD NEW CLIENT
  ========================================================= */

  const openAddClientModal = () => {
    setShowClientDropdown(false);
    setClientSearch('');
    setShowAddClientModal(true);
  };


  const handleCreateClient = async () => {
    if (!newClient.company_name.trim()) {
      error('Client company name is required');
      return;
    }

    try {
      setCreatingClient(true);

      /*
       * IMPORTANT:
       * This payload follows ClientCreate exactly.
       *
       * DO NOT send name.
       * DO NOT send client_id.
       * DO NOT send invoice fields.
       */

      const payload = {
        company_name: newClient.company_name.trim(),

        contact_person:
          newClient.contact_person?.trim() || null,

        email:
          newClient.email?.trim() || null,

        phone:
          newClient.phone?.trim() || null,

        gst_number:
          newClient.gst_number?.trim() || null,

        address:
          newClient.address?.trim() || null,
      };


      const response =
        await api.clients.create(payload);


      const createdClient =
        response?.data;


      if (!createdClient?.id) {
        throw new Error(
          'Client was created but the server did not return a client ID.'
        );
      }


      /* Add client to local list */

      setClients((prev) => [
        ...prev,
        createdClient,
      ]);


      /* Automatically select new client */

      handleClientSelect(createdClient);


      /* Reset modal */

      setNewClient(initialNewClient);

      setShowAddClientModal(false);

      success(
        'Client created successfully'
      );
    } catch (err) {
      console.error(
        'Create client error:',
        err
      );

      error(
        getApiErrorMessage(
          err,
          'Failed to create client'
        )
      );
    } finally {
      setCreatingClient(false);
    }
  };


  /* =========================================================
     ITEMS
  ========================================================= */

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,

      items: [
        ...prev.items,
        createEmptyItem(),
      ],
    }));
  };


  const removeItem = (id) => {
    if (formData.items.length === 1) {
      error(
        'Invoice must contain at least one item'
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,

      items: prev.items.filter(
        (item) => item.id !== id
      ),
    }));
  };


  const updateItem = (
    id,
    field,
    value
  ) => {
    setFormData((prev) => ({
      ...prev,

      items: prev.items.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (field === 'quantity') {
          return {
            ...item,
            quantity:
              Math.max(
                1,
                Number(value) || 1
              ),
          };
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    }));
  };


  const handleProductChange = (
    itemId,
    productId
  ) => {
    const selectedProduct =
      products.find(
        (product) =>
          String(product.id) ===
          String(productId)
      );


    setFormData((prev) => ({
      ...prev,

      items: prev.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,

          productId,

          unitPrice:
            Number(
              selectedProduct?.price || 0
            ),

          tax:
            Number(
              selectedProduct?.gst_percent || 0
            ),
        };
      }),
    }));
  };

  /* =========================================================
   PRODUCT DROPDOWN
========================================================= */

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const openAddProductModal = (itemId) => {
    setActiveItemId(itemId);
    setShowProductDropdown(false);
    setProductSearch('');
    setShowAddProductModal(true);
  };

  const handleProductSelect = (itemId, product) => {
    handleProductChange(itemId, product.id);
    setShowProductDropdown(false);
    setProductSearch('');
  };

  /* =========================================================
     CREATE PRODUCT
  ========================================================= */

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim()) {
      error('Product name is required');
      return;
    }

    if (!newProduct.price) {
      error('Product price is required');
      return;
    }

    try {
      setCreatingProduct(true);

      const payload = {
        name: newProduct.name.trim(),
        description: newProduct.description.trim() || null,
        price: Number(newProduct.price),
        gst_percent: Number(newProduct.gst_percent),
        is_active: true,
      };

      const response = await api.products.create(payload);
      const createdProduct = response.data;

      // Add the newly created product to the products list
      setProducts((prev) => [...prev, createdProduct]);

      // Automatically select the newly created product
      // AND directly use its price and GST values.
      if (activeItemId) {
        setFormData((prev) => ({
          ...prev,
          items: prev.items.map((item) => {
            if (item.id !== activeItemId) {
              return item;
            }

            return {
              ...item,
              productId: createdProduct.id,
              unitPrice: Number(createdProduct.price) || 0,
              tax: Number(createdProduct.gst_percent) || 0,
            };
          }),
        }));
      }

      // Reset modal
      setNewProduct(initialNewProduct);
      setShowAddProductModal(false);
      setActiveItemId(null);
      setProductSearch('');
      setShowProductDropdown(false);

      success('Product created successfully');

    } catch (err) {
      console.error('Create product error:', err);

      error(
        getApiErrorMessage(
          err,
          'Failed to create product'
        )
      );
    } finally {
      setCreatingProduct(false);
    }
  };



  /* =========================================================
     TOTALS
  ========================================================= */

  const totals = useMemo(() => {
    return calculateInvoiceTotals(
      formData.items,
      formData.discount,
      formData.discountType,
      0
    );
  }, [
    formData.items,
    formData.discount,
    formData.discountType,
  ]);


  /* =========================================================
     VALID ITEMS
  ========================================================= */

  const validItems = useMemo(() => {
    return formData.items.filter(
      (item) =>
        item.productId &&
        Number(item.quantity) > 0
    );
  }, [formData.items]);


  /* =========================================================
     LOGO
  ========================================================= */

  const handleLogoChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      error(
        'Please select a valid image file'
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      error(
        'Logo must be smaller than 2MB'
      );
      return;
    }


    if (companyLogoUrl) {
      URL.revokeObjectURL(
        companyLogoUrl
      );
    }


    const url =
      URL.createObjectURL(file);

    setCompanyLogo(file);
    setCompanyLogoUrl(url);
  };


  const removeLogo = () => {
    if (companyLogo) {
      if (companyLogoUrl) {
        URL.revokeObjectURL(companyLogoUrl);
      }
    }

    setCompanyLogo(null);
    setCompanyLogoUrl('');

    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };


  /* =========================================================
     CREATE INVOICE
  ========================================================= */

  const handleSave = async () => {
    if (!formData.clientId) {
      error('Please select a client');
      return;
    }

    if (!formData.invoiceNumber.trim()) {
      error('Invoice number is required');
      return;
    }

    if (!formData.invoiceDate) {
      error('Invoice date is required');
      return;
    }

    if (validItems.length === 0) {
      error('Please add at least one product');
      return;
    }

    try {
      setSaving(true);

      // --------------------------------
      // 1. Create invoice
      // --------------------------------

      const payload = {
        client_id: Number(formData.clientId),

        invoice_number:
          formData.invoiceNumber.trim(),

        invoice_date:
          formData.invoiceDate,

        currency: profile?.currency || "INR",

        due_date:
          formData.dueDate || null,

        discount:
          String(Number(formData.discount) || 0),

        amount_paid: Number(amountPaid) || 0,

        notes:
          formData.notes?.trim() || null,

        terms:
          formData.terms?.trim() || null,

        items: validItems.map((item) => ({
          product_id: Number(item.productId),
          quantity: String(item.quantity),
        })),
      };

      console.log(
        'Creating invoice:',
        payload
      );

      const response =
        await api.invoices.create(payload);

      const createdInvoice =
        response?.data;

      console.log(
        'Created invoice:',
        createdInvoice
      );

      if (!createdInvoice?.id) {
        throw new Error(
          'Invoice was created but no invoice ID was returned.'
        );
      }

      // --------------------------------
      // 2. Upload logo
      // --------------------------------

      if (companyLogo) {
        console.log('Uploading invoice logo...');
        console.log('Logo file:', {
          name: companyLogo.name,
          type: companyLogo.type,
          size: companyLogo.size,
        });

        const logoResponse =
          await api.invoices.uploadLogo(
            createdInvoice.id,
            companyLogo,
            (progress) => {
              console.log(
                `Logo upload: ${progress}%`
              );
            }
          );

        console.log(
          'Logo uploaded:',
          logoResponse?.data
        );
      }


      // --------------------------------
      // 3. Success
      // --------------------------------

      success(
        `Invoice ${createdInvoice.invoice_number ||
        formData.invoiceNumber
        } created successfully`
      );

      navigate(`/invoices/${createdInvoice.id}/view`);

    } catch (err) {
      console.error(
        'Create invoice error:',
        err
      );

      console.error(
        'Server response:',
        err?.response?.data
      );

      console.error(
        'Status:',
        err?.response?.status
      );


      error(
        getApiErrorMessage(
          err,
          'Failed to create invoice'
        )
      );

    } finally {
      setSaving(false);
    }
  };



  /* =========================================================
     PREVIEW
  ========================================================= */

  const handlePreview = () => {
    setShowPreview(true);
  };


  /* =========================================================
     SEND
  ========================================================= */

  const handleSend = () => {
    /*
     * POST /invoices/{id}/send
     * is not implemented according to your current API.
     */

    error(
      'Invoice sending is not available yet because the backend send endpoint is not implemented.'
    );
  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-screen pb-12">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-8">

        <button
          type="button"
          onClick={() =>
            navigate('/invoices')
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors mb-4"
        >
          <FiArrowLeft size={16} />
          Back to Invoices
        </button>


        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Create Invoice
              </h1>

              <Badge variant="neutral">
                Draft
              </Badge>
            </div>

            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Create a professional invoice for your client.
            </p>
          </div>


          <div className="flex flex-wrap items-center gap-3">

            <Button
              variant="secondary"
              onClick={handlePreview}
              leftIcon={
                <FiFileText size={17} />
              }
            >
              Preview
            </Button>


            <Button
              onClick={handleSave}
              disabled={saving}
              leftIcon={
                <FiCheck size={17} />
              }
            >
              {saving
                ? 'Creating...'
                : 'Create Invoice'}
            </Button>

          </div>

        </div>
      </div>
      {/* =====================================================
          Add Product MODAL
      ===================================================== */}


      <Modal
        isOpen={showAddProductModal}
        title="Add New Product"
        onClose={() => setShowAddProductModal(false)}
      >
        <div className="space-y-4">

          <Input
            label="Product Name"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                name: e.target.value,
              })
            }
          />

          <Textarea
            label="Description"
            rows={2}
            value={newProduct.description}
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                description: e.target.value,
              })
            }
          />

          <div className="grid grid-cols-2 gap-4">

            <Input
              label="Price"
              type="number"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  price: e.target.value,
                })
              }
            />

            <Input
              label="GST %"
              type="number"
              value={newProduct.gst_percent}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  gst_percent: e.target.value,
                })
              }
            />

          </div>

          <div className="flex justify-end gap-3 pt-3">

            <Button
              variant="secondary"
              onClick={() => setShowAddProductModal(false)}
            >
              Cancel
            </Button>

            <Button
              loading={creatingProduct}
              onClick={handleCreateProduct}
            >
              Add Product
            </Button>

          </div>

        </div>
      </Modal>


      {/* =====================================================
          MAIN LAYOUT
      ===================================================== */}

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_390px] gap-6">


        {/* ========================
        ===========================
            LEFT SIDE - INVOICE BUILDER
        =================================================== */}

        <div className="space-y-6">


          {/* =================================================
              INVOICE INFORMATION
          ================================================= */}

          <Card>

            <Card.Header>
              <div>
                <Card.Title>
                  Invoice Information
                </Card.Title>

                <p className="text-sm text-gray-500 mt-1">
                  Basic information shown on the invoice.
                </p>
              </div>
            </Card.Header>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <Input
                label="Invoice Number"
                value={formData.invoiceNumber}
                readOnly
                required
                placeholder={
                  loadingInvoiceNumber
                    ? 'Generating invoice number...'
                    : 'Invoice number'
                }
              />
              <p className="text-xs text-red-400 mt-10">
                Invoice number is generated automatically.
              </p>


              <Input
                label="Invoice Date"
                type="date"
                value={
                  formData.invoiceDate
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    invoiceDate:
                      e.target.value,
                  }))
                }
                required
              />


              <Input
                label="Due Date"
                type="date"
                value={
                  formData.dueDate
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dueDate:
                      e.target.value,
                  }))
                }
              />


              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>

                <div className="h-[42px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
                  {formData.currency}
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  Currency is taken from your profile settings.
                </p>
              </div>

            </div>

          </Card>


          {/* =================================================
              FROM / COMPANY
          ================================================= */}

          <Card>

            <Card.Header>
              <div>
                <Card.Title>
                  From
                </Card.Title>

                <p className="text-sm text-gray-500 mt-1">
                  Your business information.
                </p>
              </div>
            </Card.Header>


            <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-6">

              {/* LOGO */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Logo
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    (From Profile)
                  </span>
                </label>



                <div className="relative">

                  {companyLogoUrl ? (
                    <div className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 overflow-hidden">

                      <img
                        src={companyLogoUrl}
                        alt="Company logo"
                        className="w-full h-full object-contain p-4"
                      />


                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600"
                      >
                        <FiX size={15} />
                      </button>

                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        logoInputRef.current?.click()
                      }
                      className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center text-gray-400"
                    >
                      <FiImage
                        size={30}
                        className="mb-2"
                      />

                      <span className="text-sm font-medium">
                        Upload Logo
                      </span>

                      <span className="text-xs mt-1 text-center px-2">
                        Optional · PNG, JPG up to 2MB
                      </span>


                      <span className="text-xs mt-1">
                        PNG, JPG up to 2MB
                      </span>
                    </button>
                  )}


                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />

                </div>

              </div>


              {/* COMPANY FIELDS */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <Input
                  label="Company Name"
                  value={
                    formData.company.name
                  }
                  onChange={(e) =>
                    handleCompanyChange(
                      'name',
                      e.target.value
                    )
                  }
                  required
                />


                <Input
                  label="Email"
                  type="email"
                  value={
                    formData.company.email
                  }
                  onChange={(e) =>
                    handleCompanyChange(
                      'email',
                      e.target.value
                    )
                  }
                />


                <Input
                  label="Phone"
                  value={
                    formData.company.phone
                  }
                  onChange={(e) =>
                    handleCompanyChange(
                      'phone',
                      e.target.value
                    )
                  }
                />


                <Input
                  label="Tax ID / GST"
                  value={
                    formData.company.taxId
                  }
                  onChange={(e) =>
                    handleCompanyChange(
                      'taxId',
                      e.target.value
                    )
                  }
                />


                <div className="md:col-span-2">

                  <Textarea
                    label="Address"
                    rows={2}
                    value={
                      formData.company.address
                    }
                    onChange={(e) =>
                      handleCompanyChange(
                        'address',
                        e.target.value
                      )
                    }
                    placeholder="Business address"
                  />

                </div>


                <Input
                  label="City"
                  value={
                    formData.company.city
                  }
                  onChange={(e) =>
                    handleCompanyChange(
                      'city',
                      e.target.value
                    )
                  }
                />


                <Input
                  label="State"
                  value={
                    formData.company.state
                  }
                  onChange={(e) =>
                    handleCompanyChange(
                      'state',
                      e.target.value
                    )
                  }
                />


                <Input
                  label="ZIP / Postal Code"
                  value={
                    formData.company.zip
                  }
                  onChange={(e) =>
                    handleCompanyChange(
                      'zip',
                      e.target.value
                    )
                  }
                />


                <Input
                  label="Country"
                  value={
                    formData.company.country
                  }
                  onChange={(e) =>
                    handleCompanyChange(
                      'country',
                      e.target.value
                    )
                  }
                />

              </div>

            </div>

          </Card>


          {/* =================================================
              BILL TO / CLIENT
          ================================================= */}

          <Card>

            <Card.Header>
              <div>
                <Card.Title>
                  Bill To
                </Card.Title>

                <p className="text-sm text-gray-500 mt-1">
                  Choose an existing client or create a new one.
                </p>
              </div>
            </Card.Header>


            <div className="space-y-5">


              {/* CLIENT SELECTOR */}

              <div className="relative">

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>


                <button
                  type="button"
                  onClick={() =>
                    setShowClientDropdown(
                      (prev) => !prev
                    )
                  }
                  className="w-full min-h-[64px] rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-left flex items-center justify-between hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >

                  <div className="min-w-0">

                    {formData.clientId ? (
                      <>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {formData.client.name ||
                            'Unnamed Client'}
                        </p>

                        {formData.client.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {
                              formData.client.email
                            }
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-gray-500">
                          {loadingData
                            ? 'Loading clients...'
                            : 'Select a client'}
                        </p>

                        {!loadingData && (
                          <p className="text-xs text-gray-400 mt-1">
                            Search your clients below
                          </p>
                        )}
                      </>
                    )}

                  </div>


                  <FiChevronDown
                    size={19}
                    className={`ml-3 flex-shrink-0 text-gray-400 transition-transform ${showClientDropdown
                      ? 'rotate-180'
                      : ''
                      }`}
                  />

                </button>


                {/* DROPDOWN */}

                {showClientDropdown && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">

                    {/* SEARCH */}

                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">

                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) =>
                          setClientSearch(
                            e.target.value
                          )
                        }
                        placeholder="Search by company, email or phone..."
                        autoFocus
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />

                    </div>


                    {/* ADD CLIENT */}

                    <button
                      type="button"
                      onClick={openAddClientModal}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left border-b border-gray-200 dark:border-gray-700 text-primary hover:bg-primary/5 transition-colors"
                    >

                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FiUserPlus size={17} />
                      </div>

                      <div>
                        <p className="font-semibold text-sm">
                          Add New Client
                        </p>

                        <p className="text-xs text-gray-500 mt-0.5">
                          Create a client without leaving this page
                        </p>
                      </div>

                    </button>


                    {/* CLIENT LIST */}

                    <div className="max-h-72 overflow-y-auto">

                      {filteredClients.length === 0 ? (
                        <div className="p-6 text-center">

                          <p className="text-sm text-gray-500">
                            No clients found.
                          </p>

                          <button
                            type="button"
                            onClick={openAddClientModal}
                            className="mt-2 text-sm text-primary font-medium hover:underline"
                          >
                            Create a new client
                          </button>

                        </div>
                      ) : (
                        filteredClients.map(
                          (client) => {

                            const selected =
                              String(
                                formData.clientId
                              ) ===
                              String(client.id);


                            return (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() =>
                                  handleClientSelect(
                                    client
                                  )
                                }
                                className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selected
                                  ? 'bg-primary/5'
                                  : ''
                                  }`}
                              >

                                <div className="min-w-0">

                                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {getClientName(
                                      client
                                    )}
                                  </p>

                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                    {getClientEmail(
                                      client
                                    ) ||
                                      'No email provided'}
                                  </p>

                                </div>


                                {selected && (
                                  <FiCheck
                                    size={18}
                                    className="text-primary flex-shrink-0 ml-3"
                                  />
                                )}

                              </button>
                            );
                          }
                        )
                      )}

                    </div>

                  </div>
                )}

              </div>


              {/* SELECTED CLIENT DETAILS */}

              {formData.clientId && (
                <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-5">

                  <div className="flex items-center justify-between mb-4">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Client Details
                      </p>

                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        {
                          formData.client.name
                        }
                      </p>
                    </div>


                    <button
                      type="button"
                      onClick={() => {
                        setFormData(
                          (prev) => ({
                            ...prev,
                            clientId: '',
                            client: {
                              name: '',
                              email: '',
                              phone: '',
                              address: '',
                              city: '',
                              state: '',
                              zip: '',
                              country: '',
                              taxId: '',
                            },
                          })
                        );
                      }}
                      className="text-xs text-gray-500 hover:text-red-500"
                    >
                      Change client
                    </button>

                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <Input
                      label="Email"
                      type="email"
                      value={
                        formData.client.email
                      }
                      onChange={(e) =>
                        handleClientChange(
                          'email',
                          e.target.value
                        )
                      }
                    />


                    <Input
                      label="Phone"
                      value={
                        formData.client.phone
                      }
                      onChange={(e) =>
                        handleClientChange(
                          'phone',
                          e.target.value
                        )
                      }
                    />


                    <Input
                      label="Tax ID / GST"
                      value={
                        formData.client.taxId
                      }
                      onChange={(e) =>
                        handleClientChange(
                          'taxId',
                          e.target.value
                        )
                      }
                    />


                    <Input
                      label="City"
                      value={
                        formData.client.city
                      }
                      onChange={(e) =>
                        handleClientChange(
                          'city',
                          e.target.value
                        )
                      }
                    />


                    <div className="md:col-span-2">

                      <Textarea
                        label="Address"
                        rows={2}
                        value={
                          formData.client.address
                        }
                        onChange={(e) =>
                          handleClientChange(
                            'address',
                            e.target.value
                          )
                        }
                      />

                    </div>


                    <Input
                      label="State"
                      value={
                        formData.client.state
                      }
                      onChange={(e) =>
                        handleClientChange(
                          'state',
                          e.target.value
                        )
                      }
                    />


                    <Input
                      label="ZIP / Postal Code"
                      value={
                        formData.client.zip
                      }
                      onChange={(e) =>
                        handleClientChange(
                          'zip',
                          e.target.value
                        )
                      }
                    />

                  </div>

                </div>
              )}

            </div>

          </Card>


          {/* =================================================
              ITEMS
          ================================================= */}

          <Card>

            <Card.Header>

              <div>
                <Card.Title>
                  Items
                </Card.Title>

                <p className="text-sm text-gray-500 mt-1">
                  Add the products or services being billed.
                </p>
              </div>


              <Button
                variant="secondary"
                size="sm"
                onClick={addItem}
                leftIcon={
                  <FiPlus size={16} />
                }
              >
                Add Item
              </Button>

            </Card.Header>


            <div className="space-y-3">

              {/* DESKTOP HEADER */}
              <div className="hidden xl:grid grid-cols-[minmax(200px,1fr)_90px_120px_100px_120px_44px] gap-4 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">


                <span>Product</span>
                <span>Qty</span>
                <span>Unit Price</span>
                <span>Tax</span>
                <span className="text-right">
                  Amount
                </span>
                <span />
              </div>


              {formData.items.map(
                (item, index) => {

                  const itemTotal =
                    Number(item.quantity || 0) *
                    Number(item.unitPrice || 0);


                  const taxAmount =
                    itemTotal *
                    (Number(item.tax || 0) / 100);


                  const totalWithTax =
                    itemTotal + taxAmount;


                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800/50"
                    >

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(200px,1fr)_90px_120px_100px_120px_44px] gap-3 items-end">


                        {/* PRODUCT */}

                        <div>

                          <label className="block text-xs font-semibold text-gray-500 mb-2 lg:hidden">
                            Product
                          </label>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveItemId(item.id);
                                setShowProductDropdown(
                                  showProductDropdown === item.id ? null : item.id
                                );
                              }}
                              className="w-full h-[42px] px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between text-left"
                            >
                              <span className="truncate">
                                {products.find(
                                  (p) => String(p.id) === String(item.productId)
                                )?.name || 'Select product'}
                              </span>

                              <FiChevronDown size={16} />
                            </button>

                            {showProductDropdown === item.id && (
                              <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">

                                {/* Search */}
                                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                  <Input
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                  />
                                </div>

                                {/* Add Product */}
                                <button
                                  type="button"
                                  onClick={() => openAddProductModal(item.id)}
                                  className="w-full px-4 py-3 flex items-center gap-3 text-left border-b border-gray-200 dark:border-gray-700 text-primary hover:bg-primary/5"
                                >
                                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <FiPlus size={16} />
                                  </div>

                                  <div>
                                    <p className="font-semibold text-sm">
                                      Add New Product
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Create without leaving this page
                                    </p>
                                  </div>
                                </button>

                                {/* Product List */}
                                <div className="max-h-64 overflow-y-auto">
                                  {filteredProducts.length === 0 ? (
                                    <div className="p-5 text-center text-sm text-gray-500">
                                      No products found
                                    </div>
                                  ) : (
                                    filteredProducts.map((product) => (
                                      <button
                                        key={product.id}
                                        type="button"
                                        onClick={() =>
                                          handleProductSelect(item.id, product)
                                        }
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between"
                                      >
                                        <div>
                                          <p className="font-medium">
                                            {product.name}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {formatCurrency(
                                              Number(product.price),
                                              formData.currency
                                            )}{' '}
                                            • {product.gst_percent}% GST
                                          </p>
                                        </div>

                                        {String(item.productId) ===
                                          String(product.id) && (
                                            <FiCheck className="text-primary" />
                                          )}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                        </div>


                        {/* QTY */}

                        <div>

                          <label className="block text-xs font-semibold text-gray-500 mb-2 lg:hidden">
                            Quantity
                          </label>

                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={
                              item.quantity
                            }
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                'quantity',
                                e.target.value
                              )
                            }
                          />

                        </div>


                        {/* PRICE */}

                        <div>

                          <label className="block text-xs font-semibold text-gray-500 mb-2 lg:hidden">
                            Unit Price
                          </label>

                          <div className="h-[42px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
                            {formatCurrency(
                              Number(
                                item.unitPrice || 0
                              ),
                              formData.currency
                            )}
                          </div>

                        </div>


                        {/* TAX */}

                        <div>

                          <label className="block text-xs font-semibold text-gray-500 mb-2 lg:hidden">
                            Tax
                          </label>

                          <div className="h-[42px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
                            {Number(
                              item.tax || 0
                            )}
                            %
                          </div>

                        </div>


                        {/* AMOUNT */}

                        <div>

                          <label className="block text-xs font-semibold text-gray-500 mb-2 lg:hidden">
                            Amount
                          </label>

                          <div className="h-[42px] flex items-center justify-end text-sm font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(
                              totalWithTax,
                              formData.currency
                            )}
                          </div>

                        </div>


                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="h-[42px] w-[42px] rounded-lg border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                          title="Remove item"
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <FiTrash2 size={17} />
                        </button>


                      </div>


                      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">

                        <span>
                          Item #{index + 1}
                        </span>

                        {item.productId && (
                          <span>
                            {item.quantity} ×{' '}
                            {formatCurrency(
                              Number(
                                item.unitPrice || 0
                              ),
                              formData.currency
                            )}
                          </span>
                        )}

                      </div>

                    </div>
                  );
                }
              )}


              {/* ADD ITEM */}

              <button
                type="button"
                onClick={addItem}
                className="w-full rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 py-5 text-sm font-medium text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <FiPlus size={17} />
                Add another item
              </button>

            </div>

          </Card>


          {/* =================================================
              NOTES + TOTALS
          ================================================= */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


            {/* NOTES */}

            <Card>

              <Card.Header>
                <div>
                  <Card.Title>
                    Notes
                  </Card.Title>

                  <p className="text-sm text-gray-500 mt-1">
                    Additional information for your client.
                  </p>
                </div>
              </Card.Header>


              <Textarea
                rows={10}
                value={
                  formData.notes
                }
                onChange={(e) =>
                  setFormData(
                    (prev) => ({
                      ...prev,
                      notes:
                        e.target.value,
                    })
                  )
                }
                placeholder="Thank you for your business..."
              />

            </Card>

            {/* TOTALS */}

            <Card>

              <Card.Header>
                <Card.Title>
                  Invoice Summary
                </Card.Title>
              </Card.Header>


              <div className="space-y-3">

                <div className="flex justify-between items-center">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(
                      totals.subtotal,
                      formData.currency
                    )}
                  </span>
                </div>


                <div className="flex justify-between items-center">
                  <span className="text-gray-500">
                    Tax
                  </span>

                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(
                      totals.tax,
                      formData.currency
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">

                  <label className="text-gray-500">
                    Amount Paid
                  </label>

                  <div className="w-32">

                    <Input
                      type="number"
                      value={amountPaid}
                      onChange={(e) =>
                        setAmountPaid(
                          Math.max(
                            0,
                            Number(e.target.value) || 0
                          )
                        )
                      }
                    />

                  </div>

                </div>


                <div className="flex items-center justify-between gap-4">

                  <label className="text-gray-500">
                    Discount
                  </label>

                  <div className="flex items-center gap-2">

                    <select
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discountType: e.target.value,
                          discount: 0,
                        }))
                      }
                      className="h-[42px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
                    >
                      <option value="fixed">₹</option>
                      <option value="percentage">%</option>
                    </select>

                    <input
                      type="number"
                      min={0}
                      max={formData.discountType === "percentage" ? 100 : undefined}
                      value={formData.discount}
                      onChange={(e) => {
                        let value = Number(e.target.value);

                        if (formData.discountType === "percentage") {
                          value = Math.min(100, Math.max(0, value));
                        } else {
                          value = Math.max(0, value);
                        }

                        setFormData((prev) => ({
                          ...prev,
                          discount: value,
                        }));
                      }}
                      className="h-[42px] w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />

                  </div>

                </div>

                {Number(
                  formData.discount
                ) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount Applied
                      </span>

                      <span>
                        -
                        {formatCurrency(
                          totals.discount,
                          formData.currency
                        )}
                      </span>
                    </div>
                  )}


                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">

                  <div className="flex items-end justify-between">

                    <div>
                      <p className="text-sm text-gray-500">
                        Grand Total
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Amount payable
                      </p>
                    </div>

                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(
                        totals.total,
                        formData.currency
                      )}
                    </p>

                  </div>

                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">
                    Amount Left to Pay
                  </span>

                  <span className="text-sm font-medium text-red-500">
                    {formatCurrency(
                      Math.max(
                        0,
                        totals.total - (Number(amountPaid) || 0)
                      ),
                      formData.currency
                    )}
                  </span>
                </div>


              </div>

            </Card>

          </div>
          {/* TERMS */}

          <Card>

            <Card.Header>
              <div>
                <Card.Title>
                  Terms & Condition
                </Card.Title>

                <p className="text-sm text-gray-500 mt-1">
                  Terms & Condition of our Company
                </p>
              </div>
            </Card.Header>


            <Textarea
              rows={7}
              value={
                formData.terms
              }
              onChange={(e) =>
                setFormData(
                  (prev) => ({
                    ...prev,
                    terms:
                      e.target.value,
                  })
                )
              }
              placeholder="Our Terms & Condition include...."
            />

          </Card>


          {/* =================================================
              BOTTOM ACTIONS
          ================================================= */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">

            <p className="text-sm text-gray-500">
              Make sure the client and at least one product are selected before saving.
            </p>


            <div className="flex items-center gap-3">

              <Button
                variant="secondary"
                onClick={() =>
                  navigate('/invoices')
                }
              >
                Cancel
              </Button>


              <Button
                variant="secondary"
                onClick={handlePreview}
                leftIcon={
                  <FiFileText size={17} />
                }
              >
                Preview
              </Button>


              <Button
                onClick={handleSave}
                disabled={saving}
                leftIcon={
                  <FiSave size={17} />
                }
              >
                {saving
                  ? 'Saving...'
                  : 'Save Invoice'}
              </Button>

            </div>

          </div>

        </div>


        {/* ===================================================
            RIGHT SIDE - LIVE PREVIEW
        =================================================== */}

        <div>

          <div className="2xl:sticky 2xl:top-6">

            <Card className="overflow-hidden">

              <Card.Header>

                <div>
                  <Card.Title>
                    Live Preview
                  </Card.Title>

                  <p className="text-xs text-gray-400 mt-1">
                    Updates as you edit the invoice.
                  </p>
                </div>


                <button
                  type="button"
                  onClick={handlePreview}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Full Preview
                </button>

              </Card.Header>


              {/* MINI INVOICE */}

              <div className="p-4">

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-gray-900">

                  {/* HEADER */}

                  <div className="p-6 border-b border-gray-200">

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        {companyLogoUrl && (
                          <img
                            src={companyLogoUrl}
                            alt="Company logo"
                            className="w-14 h-14 object-contain mb-3"
                          />
                        )}

                        <p className="font-bold text-lg">
                          {
                            formData.company
                              .name ||
                            'Your Company'
                          }
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {
                            formData.company
                              .email
                          }
                        </p>

                      </div>


                      <div className="text-right">

                        <p className="text-xl font-black tracking-wide">
                          INVOICE
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          #
                          {
                            formData.invoiceNumber
                          }
                        </p>

                        <div className="mt-3">
                          <Badge variant="neutral">
                            DRAFT
                          </Badge>
                        </div>

                      </div>

                    </div>

                  </div>


                  {/* FROM / TO */}

                  <div className="grid grid-cols-2 gap-5 p-6 border-b border-gray-200">

                    <div>

                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
                        From
                      </p>

                      <p className="text-sm font-semibold">
                        {
                          formData.company
                            .name ||
                          'Your Company'
                        }
                      </p>

                      <p className="text-xs text-gray-500 mt-1 leading-5">
                        {
                          formData.company
                            .address
                        }
                        <br />
                        {
                          formData.company
                            .city
                        }
                        {formData.company.city &&
                          formData.company.state
                          ? ', '
                          : ''}
                        {
                          formData.company
                            .state
                        }
                      </p>

                    </div>


                    <div>

                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
                        Bill To
                      </p>

                      <p className="text-sm font-semibold">
                        {
                          formData.client
                            .name ||
                          'Client Name'
                        }
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {
                          formData.client
                            .email ||
                          'Client email'
                        }
                      </p>

                      {formData.client.address && (
                        <p className="text-xs text-gray-500 mt-1 leading-5">
                          {
                            formData.client
                              .address
                          }
                        </p>
                      )}

                    </div>

                  </div>


                  {/* DATES */}

                  <div className="grid grid-cols-2 gap-4 p-6 border-b border-gray-200">

                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                        Invoice Date
                      </p>

                      <p className="text-xs font-medium mt-1">
                        {formData.invoiceDate
                          ? formatDate(
                            formData.invoiceDate
                          )
                          : '-'}
                      </p>
                    </div>


                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                        Due Date
                      </p>

                      <p className="text-xs font-medium mt-1">
                        {formData.dueDate
                          ? formatDate(
                            formData.dueDate
                          )
                          : 'Not specified'}
                      </p>
                    </div>

                  </div>


                  {/* ITEMS */}

                  <div className="p-6">

                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-gray-400 pb-3 border-b border-gray-200">

                      <span>
                        Products / Services
                      </span>

                      <span>
                        Amount
                      </span>

                    </div>


                    <div className="divide-y divide-gray-100">

                      {validItems.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          No items added yet
                        </div>
                      ) : (
                        validItems
                          .slice(0, 5)
                          .map((item) => {

                            const lineTotal =
                              Number(
                                item.quantity || 0
                              ) *
                              Number(
                                item.unitPrice || 0
                              ) *
                              (
                                1 +
                                Number(
                                  item.tax || 0
                                ) / 100
                              );

                            return (
                              <div
                                key={item.id}
                                className="py-3 flex justify-between gap-3"
                              >

                                <div className="min-w-0">

                                  <p className="text-xs font-medium truncate">
                                    {getProductName(item)}
                                  </p>


                                  <p className="text-[10px] text-gray-400 mt-1">
                                    {item.quantity}{' '}
                                    ×{' '}
                                    {formatCurrency(
                                      Number(
                                        item.unitPrice ||
                                        0
                                      ),
                                      formData.currency
                                    )}
                                  </p>

                                </div>


                                <p className="text-xs font-semibold whitespace-nowrap">
                                  {formatCurrency(
                                    lineTotal,
                                    formData.currency
                                  )}
                                </p>

                              </div>
                            );
                          })
                      )}

                    </div>


                    {validItems.length > 5 && (
                      <p className="text-[10px] text-gray-400 pt-2">
                        +
                        {validItems.length - 5}{' '}
                        more items
                      </p>
                    )}


                    {/* TOTAL */}

                    <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">

                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">
                          Subtotal
                        </span>

                        <span>
                          {formatCurrency(
                            totals.subtotal,
                            formData.currency
                          )}
                        </span>
                      </div>


                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">
                          Tax
                        </span>

                        <span>
                          {formatCurrency(
                            totals.tax,
                            formData.currency
                          )}
                        </span>
                      </div>


                      {totals.discount > 0 && (
                        <div className="flex justify-between text-xs text-green-600">
                          <span>
                            Discount
                          </span>

                          <span>
                            -
                            {formatCurrency(
                              totals.discount,
                              formData.currency
                            )}
                          </span>
                        </div>
                      )}


                      <div className="flex justify-between items-center bg-gray-900 text-white rounded-xl px-4 py-3 mt-3">

                        <span className="text-xs font-medium">
                          Total
                        </span>

                        <span className="font-bold">
                          {formatCurrency(
                            totals.total,
                            formData.currency
                          )}
                        </span>

                      </div>

                    </div>


                    {formData.notes && (
                      <div className="mt-5 pt-4 border-t border-gray-200">

                        <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
                          Notes
                        </p>

                        <p className="text-xs text-gray-500 leading-5">
                          {
                            formData.notes
                          }
                        </p>

                      </div>
                    )}

                    {formData.terms && (
                      <div className="mt-5 pt-4 border-t border-gray-200">

                        <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2">
                          Terms
                        </p>

                        <p className="text-xs text-gray-500 leading-5">
                          {
                            formData.terms
                          }
                        </p>

                      </div>
                    )}

                  </div>

                </div>

              </div>

            </Card>

          </div>

        </div>

      </div>


      {/* =====================================================
          ADD CLIENT MODAL
      ===================================================== */}

      <Modal
        isOpen={
          showAddClientModal
        }
        onClose={() => {
          if (!creatingClient) {
            setShowAddClientModal(
              false
            );
          }
        }}
        title="Add New Client"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                setShowAddClientModal(
                  false
                )
              }
              disabled={creatingClient}
            >
              Cancel
            </Button>

            <Button
              onClick={
                handleCreateClient
              }
              disabled={creatingClient}
              leftIcon={
                <FiUserPlus
                  size={17}
                />
              }
            >
              {creatingClient
                ? 'Creating...'
                : 'Create Client'}
            </Button>
          </>
        }
      >

        <div className="space-y-5">

          <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">

            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Client information
            </p>

            <p className="text-xs text-gray-500 mt-1">
              This client will be created and automatically selected for this invoice.
            </p>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Input
              label="Company Name"
              value={
                newClient.company_name
              }
              onChange={(e) =>
                setNewClient(
                  (prev) => ({
                    ...prev,
                    company_name:
                      e.target.value,
                  })
                )
              }
              placeholder="Acme Pvt Ltd"
              required
            />


            <Input
              label="Contact Person"
              value={
                newClient.contact_person
              }
              onChange={(e) =>
                setNewClient(
                  (prev) => ({
                    ...prev,
                    contact_person:
                      e.target.value,
                  })
                )
              }
              placeholder="John Smith"
            />


            <Input
              label="Email"
              type="email"
              value={
                newClient.email
              }
              onChange={(e) =>
                setNewClient(
                  (prev) => ({
                    ...prev,
                    email:
                      e.target.value,
                  })
                )
              }
              placeholder="john@example.com"
            />


            <Input
              label="Phone"
              value={
                newClient.phone
              }
              onChange={(e) =>
                setNewClient(
                  (prev) => ({
                    ...prev,
                    phone:
                      e.target.value,
                  })
                )
              }
              placeholder="+91 9876543210"
            />


            <Input
              label="GST Number"
              value={
                newClient.gst_number
              }
              onChange={(e) =>
                setNewClient(
                  (prev) => ({
                    ...prev,
                    gst_number:
                      e.target.value,
                  })
                )
              }
              placeholder="24ABCDE1234F1Z5"
            />


            <div className="md:col-span-2">

              <Textarea
                label="Address"
                rows={3}
                value={
                  newClient.address
                }
                onChange={(e) =>
                  setNewClient(
                    (prev) => ({
                      ...prev,
                      address:
                        e.target.value,
                    })
                  )
                }
                placeholder="Full billing address"
              />

            </div>

          </div>

        </div>

      </Modal>

      {/* =====================================================
          FULL PREVIEW MODAL
      ===================================================== */}

      <Modal
        isOpen={showPreview}
        onClose={() =>
          setShowPreview(false)
        }
        title="Invoice Preview"
        size="xl"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                setShowPreview(false)
              }
            >
              Close
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              leftIcon={
                <FiSave
                  size={17}
                />
              }
            >
              Save Invoice
            </Button>
          </>
        }
      >
        <div ref={previewRef} className="max-h-[calc(100vh-220px)] overflow-y-auto overscroll-contain bg-slate-100 text-black rounded-2xl p-3 sm:p-6" > <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden text-gray-900">



          {/* PREVIEW HEADER */}

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 px-6 sm:px-10 pt-8 pb-7 border-b border-gray-200">

            <div className="flex items-start gap-4">
              {companyLogoUrl && (
                <img
                  src={companyLogoUrl}
                  alt="Company logo"
                  className="w-20 h-20 object-contain flex-shrink-0"
                />
              )}

              <div>

                <h2 className="text-xl font-bold">
                  {
                    formData.company
                      .name ||
                    'Your Company'
                  }
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {
                    formData.company
                      .email
                  }
                </p>

                <p className="text-sm text-gray-500">
                  {
                    formData.company
                      .phone
                  }
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  {
                    formData.company
                      .address
                  }
                  <br />
                  {
                    formData.company
                      .city
                  }
                  {formData.company.city &&
                    formData.company.state
                    ? ', '
                    : ''}
                  {
                    formData.company
                      .state
                  }{' '}
                  {
                    formData.company
                      .zip
                  }
                  <br />
                  {
                    formData.company
                      .country
                  }
                </p>

              </div>

            </div>


            <div className="text-right">

              <h1 className="text-3xl sm:text-4xl font-black tracking-[0.08em] text-gray-900"> INVOICE </h1>

              <p className="text-sm text-gray-500 mt-2"> Invoice # <span className="font-semibold text-gray-800"> {formData.invoiceNumber} </span> </p>

              <div className="mt-4 inline-flex">
                <Badge variant="neutral">
                  DRAFT
                </Badge>
              </div>

            </div>
          </div>
        </div>


          {/* BILL TO / DETAILS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 px-6 sm:px-10 py-8 border-b border-gray-200">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Bill To
              </p>

              <p className="font-bold text-lg">
                {
                  formData.client
                    .name ||
                  'Client Name'
                }
              </p>

              {formData.client.email && (
                <p className="text-sm text-gray-500 mt-1">
                  {
                    formData.client
                      .email
                  }
                </p>
              )}

              {formData.client.phone && (
                <p className="text-sm text-gray-500">
                  {
                    formData.client
                      .phone
                  }
                </p>
              )}

              {formData.client.address && (
                <p className="text-sm text-gray-500 mt-2">
                  {
                    formData.client
                      .address
                  }
                </p>
              )}

              {formData.client.taxId && (
                <p className="text-sm text-gray-500 mt-2">
                  GST / Tax ID:{' '}
                  {
                    formData.client
                      .taxId
                  }
                </p>
              )}

            </div>


            <div className="text-right">

              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Invoice Details
              </p>

              <div className="space-y-2 text-sm">

                <div className="flex justify-end gap-6">
                  <span className="text-gray-500">
                    Invoice Date
                  </span>

                  <span className="font-medium">
                    {formData.invoiceDate
                      ? formatDate(
                        formData.invoiceDate
                      )
                      : '-'}
                  </span>
                </div>


                <div className="flex justify-end gap-6">
                  <span className="text-gray-500">
                    Due Date
                  </span>

                  <span className="font-medium">
                    {formData.dueDate
                      ? formatDate(
                        formData.dueDate
                      )
                      : 'Not Applicable'}
                  </span>
                </div>

              </div>

            </div>

          </div>


          {/* ITEMS */}

          <div className="px-6 sm:px-10 py-8 overflow-x-auto">

            <table className="w-full min-w-[650px]">


              <thead>

                <tr className="bg-gray-900 text-white">

                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider"> Products / Services </th>

                  <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-wider"> Qty </th>

                  <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-wider"> Rate </th>

                  <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-wider"> Tax </th>

                  <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-wider"> Amount </th>

                </tr>

              </thead>


              <tbody>

                {validItems.map(
                  (item) => {

                    const subtotal =
                      Number(
                        item.quantity || 0
                      ) *
                      Number(
                        item.unitPrice || 0
                      );

                    const tax =
                      subtotal *
                      (
                        Number(
                          item.tax || 0
                        ) / 100
                      );

                    const total =
                      subtotal + tax;


                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-200"
                      >

                        <td className="px-4 py-4 font-medium">
                          {getProductName(item)}
                        </td>


                        <td className="px-4 py-4 text-right">
                          {
                            item.quantity
                          }
                        </td>

                        <td className="px-4 py-4 text-right">
                          {formatCurrency(
                            Number(
                              item.unitPrice ||
                              0
                            ),
                            formData.currency
                          )}
                        </td>

                        <td className="px-4 py-4 text-right">
                          {Number(
                            item.tax || 0
                          )}
                          %
                        </td>

                        <td className="px-4 py-4 text-right font-semibold">
                          {formatCurrency(
                            total,
                            formData.currency
                          )}
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>


          {/* TOTALS */}

          <div className="flex justify-end px-6 sm:px-10">
            <div className="w-full sm:w-96 rounded-2xl bg-gray-50 border border-gray-200 p-5 space-y-3">

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span>
                  {formatCurrency(
                    totals.subtotal,
                    formData.currency
                  )}
                </span>
              </div>


              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Tax
                </span>

                <span>
                  {formatCurrency(
                    totals.tax,
                    formData.currency
                  )}
                </span>
              </div>


              {totals.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Discount
                  </span>

                  <span>
                    -
                    {formatCurrency(
                      totals.discount,
                      formData.currency
                    )}
                  </span>
                </div>
              )}


              <div className="border-t border-gray-300 pt-4 mt-4 flex justify-between items-center">

                <span className="text-lg font-bold">
                  Total
                </span>

                <span className="text-2xl font-black">
                  {formatCurrency(
                    totals.total,
                    formData.currency
                  )}
                </span>

              </div>

              {/* AMOUNT PAID */}

              <div className="flex justify-between items-center">

                <span className="text-sm text-gray-500">
                  Amount Paid
                </span>

                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(
                    Number(amountPaid) || 0,
                    formData.currency
                  )}
                </span>

              </div>

              {/* AMOUNT LEFT TO PAY */}

              <div className="flex justify-between items-center">

                <span className="text-sm text-gray-500">
                  Amount Left to Pay
                </span>

                <span className="text-sm font-medium text-red-500">
                  {formatCurrency(
                    Math.max(
                      0,
                      totals.total - (Number(amountPaid) || 0)
                    ),
                    formData.currency
                  )}
                </span>

              </div>

            </div>

          </div>


          {/* NOTES */}

          {formData.notes && (
            <div className="mx-6 sm:mx-10 mt-10 pt-6 border-t border-gray-200">

              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Notes
              </p>

              <p className="text-sm text-gray-600 whitespace-pre-line">
                {
                  formData.notes
                }
              </p>

            </div>
          )}

          {/* TERMS */}

          {formData.terms && (
            <div className="mx-6 sm:mx-10 mt-10 pt-6 border-t border-gray-200">

              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Terms
              </p>

              <p className="text-sm text-gray-600 whitespace-pre-line">
                {
                  formData.terms
                }
              </p>

            </div>
          )}


          {/* FOOTER */}

          <div className="mt-10 px-6 sm:px-10 py-6 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-xs font-medium text-gray-500"> Thank you for your business. </p>
            <p className="text-[11px] text-gray-400 mt-1"> This is a preview of your invoice. </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};


export default CreateInvoice;
