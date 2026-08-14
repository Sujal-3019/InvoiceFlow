import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../../utils/axiosInstance";

import {
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiFileText,
} from "react-icons/fi";


import { useToast } from "../../context/ToastContext";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import Modal from "../../components/ui/Modal";
import Dropdown from "../../components/ui/Dropdown";
import SearchBar from "../../components/ui/SearchBar";
import Pagination from "../../components/ui/Pagination";

// ==========================
// API CLIENT MAPPER
// ==========================

const mapClient = (client, invoices = []) => {
  const clientInvoices = invoices.filter(
    (invoice) => invoice.client_id === client.id
  );

  const totalInvoices = clientInvoices.length;

  const totalRevenue = clientInvoices.reduce(
    (sum, invoice) =>
      sum + (Number(invoice.grand_total) || 0),
    0
  );

  const receivedAmount = clientInvoices.reduce(
    (sum, invoice) =>
      sum + (Number(invoice.amount_paid) || 0),
    0
  );

  const pendingAmount = clientInvoices.reduce(
    (sum, invoice) => {
      const grandTotal =
        Number(invoice.grand_total) || 0;

      const amountPaid =
        Number(invoice.amount_paid) || 0;

      const amountDue =
        Number(invoice.amount_due) ||
        Math.max(grandTotal - amountPaid, 0);

      return sum + amountDue;
    },
    0
  );

  const sortedInvoices = [...clientInvoices].sort(
    (a, b) =>
      new Date(b.invoice_date) -
      new Date(a.invoice_date)
  );

  const lastInvoice =
    sortedInvoices.length > 0
      ? sortedInvoices[0].invoice_date
      : null;

  return {
    id: client.id,
    name: client.company_name,
    contactPerson: client.contact_person,
    email: client.email,
    phone: client.phone,
    gstNumber: client.gst_number,
    address: client.address,

    totalInvoices,
    totalRevenue,
    receivedAmount,
    pendingAmount,
    status: "active",
    lastInvoice,
  };
};

// ==========================
// COMPONENT
// ==========================

const Clients = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  // ==========================
  // CLIENT STATE
  // ==========================

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================
  // FETCH CLIENTS
  // ==========================

  const fetchClients = async () => {
    try {
      setLoading(true);

      // Fetch clients and invoices
      const [clientsResponse, invoicesResponse] =
        await Promise.all([
          api.clients.list(),
          api.invoices.list(),
        ]);

      // -------------------------
      // CLIENT DATA
      // -------------------------

      const clientsData = Array.isArray(
        clientsResponse.data
      )
        ? clientsResponse.data
        : clientsResponse.data?.clients || [];

      // -------------------------
      // INVOICE DATA
      // -------------------------

      const invoicesData = Array.isArray(
        invoicesResponse.data
      )
        ? invoicesResponse.data
        : invoicesResponse.data?.invoices || [];

      // -------------------------
      // MAP CLIENTS WITH INVOICES
      // -------------------------

      const mappedClients = clientsData.map(
        (client) =>
          mapClient(client, invoicesData)
      );

      setClients(mappedClients);

    } catch (err) {
      console.error(
        "CLIENT/INVOICE FETCH ERROR:",
        err
      );

      console.error(
        "Response:",
        err.response
      );

      console.error(
        "Response data:",
        err.response?.data
      );

      error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to load clients"
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchProfileCurrency();
  }, []);

  // ==========================
  // SEARCH + FILTER
  // ==========================

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ==========================
  // PAGINATION
  // ==========================

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // ==========================
  // MODALS
  // ==========================

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // ==========================
  // CURRENCY
  // ==========================
  const [currency, setCurrency] = useState("INR");
  const fetchProfileCurrency = async () => {
    try {
      const response = await api.profile.get();

      setCurrency(response.data?.currency || "INR");
    } catch (err) {
      console.error("FAILED TO FETCH PROFILE:", err);
      setCurrency("INR");
    }
  };
  // ==========================
  // SELECTED CLIENT
  // ==========================

  const [selectedClient, setSelectedClient] = useState(null);

  // ==========================
  // ADD CLIENT FORM
  // ==========================

  const [newClient, setNewClient] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    gstNumber: "",
    address: "",
  });

  // ==========================
  // EDIT CLIENT FORM
  // ==========================

  const [editClient, setEditClient] = useState({
    id: "",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    gstNumber: "",
    address: "",
  });

  // ==========================
  // FILTER CLIENTS
  // ==========================

  const filteredClients = clients.filter((client) => {
    const search = searchQuery.toLowerCase();

    const searchMatch =
      !search ||
      (client.name || "").toLowerCase().includes(search) ||
      (client.email || "").toLowerCase().includes(search);

    const statusMatch =
      statusFilter === "all" ||
      client.status === statusFilter;

    return searchMatch && statusMatch;
  });

  const totalPages = Math.ceil(
    filteredClients.length / itemsPerPage
  );

  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  // ==========================
  // VIEW CLIENT
  // ==========================

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setViewModalOpen(true);
  };

  // ==========================
  // VIEW CLIENT INVOICES
  // ==========================

  const handleViewInvoices = (client) => {
    navigate(`/clients/${client.id}/invoices`, {
      state: {
        client,
      },
    });
  };

  // ==========================
  // EDIT CLIENT
  // ==========================

  const handleEditClient = (client) => {
    setEditClient({
      id: client.id,
      name: client.name || "",
      contactPerson: client.contactPerson || "",
      email: client.email || "",
      phone: client.phone || "",
      gstNumber: client.gstNumber || "",
      address: client.address || "",
    });

    setEditModalOpen(true);
  };

  // ==========================
  // UPDATE CLIENT
  // ==========================

  const saveEditedClient = async () => {
    try {
      const clientData = {
        company_name: editClient.name,
        contact_person: editClient.contactPerson || "",
        email: editClient.email,
        phone: editClient.phone,
        gst_number: editClient.gstNumber || "",
        address: editClient.address,
      };

      const response = await api.clients.update(
        editClient.id,
        clientData
      );

      const updatedClient = mapClient(response.data);

      setClients((prevClients) =>
        prevClients.map((client) =>
          client.id === updatedClient.id
            ? updatedClient
            : client
        )
      );

      setSelectedClient(updatedClient);
      success("Client updated successfully");
      setEditModalOpen(false);

    } catch (err) {
      console.error("FAILED TO UPDATE CLIENT:", err);
      console.error("UPDATE RESPONSE:", err.response);
      console.error("UPDATE RESPONSE DATA:", err.response?.data);

      error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to update client"
      );
    }
  };


  // ==========================
  // DELETE CLIENT
  // ==========================

  const handleDeleteClient = async (client) => {
    const confirmDelete = window.confirm(
      `Delete ${client.name}?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.clients.delete(client.id);

      setClients((prevClients) =>
        prevClients.filter(
          (item) => item.id !== client.id
        )
      );

      // Close view modal if this client was being viewed
      if (selectedClient?.id === client.id) {
        setSelectedClient(null);
        setViewModalOpen(false);
      }

      success("Client deleted successfully");

    } catch (err) {
      console.error("FAILED TO DELETE CLIENT:", err);
      console.error("DELETE RESPONSE:", err.response);
      console.error(
        "DELETE RESPONSE DATA:",
        err.response?.data
      );

      error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to delete client"
      );
    }
  };


  // ==========================
  // ADD CLIENT
  // ==========================

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email) {
      error("Name and email are required");
      return;
    }

    try {
      const clientData = {
        company_name: newClient.name,
        contact_person: newClient.contactPerson || "",
        email: newClient.email,
        phone: newClient.phone || "",
        gst_number: newClient.gstNumber || "",
        address: newClient.address || "",
      };

      const response = await api.clients.create(clientData);
      const createdClient = mapClient(response.data);

      setClients((prevClients) => [
        ...prevClients,
        createdClient,
      ]);

      success("Client added successfully");

      setAddModalOpen(false);

      setNewClient({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        gstNumber: "",
        address: "",
      });

    } catch (err) {
      console.error("FAILED TO CREATE CLIENT:", err);
      console.error("CREATE RESPONSE:", err.response);
      console.error(
        "CREATE RESPONSE DATA:",
        err.response?.data
      );

      error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to create client"
      );
    }
  };

  // ==========================
  // HELPERS
  // ==========================

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  const formatDate = (date) => {
    if (!date) {
      return "No invoices yet";
    }

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  // currency symbol
  const getCurrencySymbol = (currencyCode) => {
    try {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value || currencyCode;
    } catch {
      return currencyCode;
    }
  };
  const currencySymbol = getCurrencySymbol(currency);
  // ==========================
  // RENDER
  // ==========================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Clients
          </h1>

          <p className="text-gray-500 dark:text-gray-400">
            Manage your clients Here
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          leftIcon={<FiPlus />}
        >
          Add Client
        </Button>
      </div>


      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* TOTAL CLIENTS */}

        <Card hover>
          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <FiFileText size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Clients
              </p>

              <p className="text-2xl font-bold">
                {clients.length}
              </p>
            </div>

          </div>
        </Card>


        {/* TOTAL REVENUE */}

        <Card hover>
          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600">
              <span className="text-lg font-bold">
                {currencySymbol}
              </span>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Revenue
              </p>

              <p className="text-2xl font-bold">
                {formatCurrency(
                  clients.reduce(
                    (sum, client) =>
                      sum + (Number(client.totalRevenue) || 0),
                    0
                  )
                )}
              </p>
            </div>

          </div>
        </Card>

        {/* RECEIVED AMOUNT */}

        <Card hover>
          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
              <FiDollarSign size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Received Amount
              </p>

              <p className="text-2xl font-bold">
                {formatCurrency(
                  clients.reduce(
                    (sum, client) =>
                      sum +
                      (Number(client.receivedAmount) || 0),
                    0
                  )
                )}
              </p>
            </div>

          </div>
        </Card>

        {/* PENDING AMOUNT */}

        <Card hover>
          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600">
              <FiDollarSign size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Pending Amount
              </p>

              <p className="text-2xl font-bold">
                {formatCurrency(
                  clients.reduce(
                    (sum, client) =>
                      sum +
                      (Number(client.pendingAmount) || 0),
                    0
                  )
                )}
              </p>
            </div>

          </div>
        </Card>


        {/* TOTAL INVOICES */}

        <Card hover>
          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600">
              <FiFileText size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Invoices
              </p>

              <p className="text-2xl font-bold">
                {clients.reduce(
                  (sum, client) =>
                    sum + (Number(client.totalInvoices) || 0),
                  0
                )}
              </p>
            </div>

          </div>
        </Card>


        {/* ACTIVE CLIENTS */}

        <Card hover>
          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600">
              <FiMapPin size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Active Clients
              </p>

              <p className="text-2xl font-bold">
                {
                  clients.filter(
                    (client) => client.status === "active"
                  ).length
                }
              </p>
            </div>

          </div>
        </Card>

      </div>


      {/* SEARCH + FILTER */}

      <Card>

        <div className="flex flex-col md:flex-row gap-4 justify-between">

          <div className="w-full md:w-96">

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search clients by name or email..."
            />

          </div>


          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card"
          >

            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

          </select>

        </div>

      </Card>


      {/* CLIENT GRID */}

      {loading ? (

        <Card className="text-center py-12">

          <p className="text-gray-500">
            Loading clients...
          </p>

        </Card>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {paginatedClients.map((client) => (

            <motion.div
              key={client.id}
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                duration: 0.3
              }}
            >

              <Card hover>

                {/* CLIENT HEADER */}

                <div className="flex justify-between items-start mb-4">

                  <div className="flex items-center gap-3">

                    <Avatar
                      name={client.name}
                      size="lg"
                    />

                    <div>

                      <h3 className="font-semibold">
                        {client.name}
                      </h3>

                      <Badge
                        variant={
                          client.status === "active"
                            ? "success"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {client.status}
                      </Badge>

                    </div>

                  </div>


                  {/* DROPDOWN */}

                  <Dropdown
                    trigger={
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <FiMoreVertical size={18} />
                      </button>
                    }
                    align="right"
                    width="sm"
                  >

                    <Dropdown.Item
                      icon={<FiFileText size={16} />}
                      onClick={() => handleViewClient(client)}
                    >
                      View Details
                    </Dropdown.Item>


                    <Dropdown.Item
                      icon={<FiFileText size={16} />}
                      onClick={() => handleViewInvoices(client)}
                    >
                      View Invoices
                    </Dropdown.Item>


                    <Dropdown.Item
                      icon={<FiEdit2 size={16} />}
                      onClick={() => handleEditClient(client)}
                    >
                      Edit Client
                    </Dropdown.Item>


                    <Dropdown.Divider />


                    <Dropdown.Item
                      icon={<FiTrash2 size={16} />}
                      className="text-danger"
                      onClick={() => handleDeleteClient(client)}
                    >
                      Delete
                    </Dropdown.Item>

                  </Dropdown>

                </div>


                {/* CLIENT INFO */}

                <div className="space-y-3">

                  <div className="flex gap-2 text-sm text-gray-500">
                    <FiMail size={15} />
                    <span>{client.email || "No email"}</span>
                  </div>


                  <div className="flex gap-2 text-sm text-gray-500">
                    <FiPhone size={15} />
                    <span>{client.phone || "No phone"}</span>
                  </div>


                  <div className="flex gap-2 text-sm text-gray-500">
                    <FiMapPin size={15} />

                    <span className="truncate">
                      {client.address || "No address"}
                    </span>
                  </div>


                  {client.contactPerson && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">
                        Contact:
                      </span>{" "}
                      {client.contactPerson}
                    </div>
                  )}


                  {client.gstNumber && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">
                        GST:
                      </span>{" "}
                      {client.gstNumber}
                    </div>
                  )}

                </div>


                {/* CLIENT STATS */}

                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-x-4 gap-y-4">

                  {/* TOTAL INVOICES */}

                  <div className="min-w-0">

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Invoices
                    </p>

                    <p className="text-lg font-bold truncate">
                      {client.totalInvoices}
                    </p>

                  </div>


                  {/* TOTAL */}

                  <div className="min-w-0">

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Total
                    </p>

                    <p className="text-lg font-bold text-primary truncate">
                      {formatCurrency(client.totalRevenue)}
                    </p>

                  </div>


                  {/* RECEIVED */}

                  <div className="min-w-0">

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Received
                    </p>

                    <p className="text-lg font-bold text-green-600 dark:text-green-400 truncate">
                      {formatCurrency(client.receivedAmount)}
                    </p>

                  </div>


                  {/* PENDING */}

                  <div className="min-w-0">

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Pending
                    </p>

                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400 truncate">
                      {formatCurrency(client.pendingAmount)}
                    </p>

                  </div>

                </div>


                {/* LAST INVOICE */}

                <div className="mt-3 text-xs text-gray-400">

                  Last invoice:{" "}

                  {client.lastInvoice
                    ? formatDate(client.lastInvoice)
                    : "No invoices yet"}

                </div>

              </Card>

            </motion.div>

          ))}

        </div>

      )}


      {/* EMPTY STATE */}

      {!loading && paginatedClients.length === 0 && (

        <Card className="text-center py-12">

          <div className="flex flex-col items-center gap-4">

            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">

              <FiSearch
                size={24}
                className="text-gray-400"
              />

            </div>

            <div>

              <p className="text-lg font-medium">
                No clients found
              </p>

              <p className="text-sm text-gray-500">
                Try adjusting your search or filters
              </p>

            </div>

          </div>

        </Card>

      )}


      {/* PAGINATION */}

      {totalPages > 1 && (

        <div className="flex justify-center">

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />

        </div>

      )}


      {/* ADD CLIENT MODAL */}

      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Client"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>

            <Button onClick={handleAddClient}>
              Add Client
            </Button>
          </>
        }
      >

        <div className="space-y-4">

          <Input
            label="Client Name"
            value={newClient.name}
            placeholder="Company or individual name"
            onChange={(e) =>
              setNewClient({
                ...newClient,
                name: e.target.value
              })
            }
          />


          <Input
            label="Contact Person"
            value={newClient.contactPerson}
            placeholder="Contact person name"
            onChange={(e) =>
              setNewClient({
                ...newClient,
                contactPerson: e.target.value
              })
            }
          />


          <Input
            label="GST Number"
            value={newClient.gstNumber}
            placeholder="22AAAAA0000A1Z5"
            onChange={(e) =>
              setNewClient({
                ...newClient,
                gstNumber: e.target.value
              })
            }
          />


          <Input
            label="Email"
            type="email"
            value={newClient.email}
            placeholder="Enter client email"
            onChange={(e) =>
              setNewClient({
                ...newClient,
                email: e.target.value
              })
            }
          />


          <Input
            label="Phone"
            value={newClient.phone}
            placeholder="9876543210"
            onChange={(e) =>
              setNewClient({
                ...newClient,
                phone: e.target.value
              })
            }
          />


          <Input
            label="Address"
            value={newClient.address}
            placeholder="Client address"
            onChange={(e) =>
              setNewClient({
                ...newClient,
                address: e.target.value
              })
            }
          />

        </div>

      </Modal>


      {/* VIEW DETAILS MODAL */}

      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Client Details"
        size="md"
      >

        {selectedClient && (

          <div className="space-y-5">

            <div className="flex items-center gap-4">

              <Avatar
                name={selectedClient.name}
                size="lg"
              />

              <div>

                <h2 className="text-xl font-semibold">
                  {selectedClient.name}
                </h2>

                <Badge
                  variant={
                    selectedClient.status === "active"
                      ? "success"
                      : "neutral"
                  }
                >
                  {selectedClient.status}
                </Badge>

              </div>

            </div>


            <div className="space-y-3 text-gray-500">

              <p className="flex items-center gap-2">
                <FiMail />
                {selectedClient.email || "No email"}
              </p>


              <p className="flex items-center gap-2">
                <FiPhone />
                {selectedClient.phone || "No phone"}
              </p>


              <p className="flex items-center gap-2">
                <FiMapPin />
                {selectedClient.address || "No address"}
              </p>


              {selectedClient.contactPerson && (
                <p>
                  <strong>Contact Person:</strong>{" "}
                  {selectedClient.contactPerson}
                </p>
              )}


              {selectedClient.gstNumber && (
                <p>
                  <strong>GST Number:</strong>{" "}
                  {selectedClient.gstNumber}
                </p>
              )}

            </div>


            <div className="grid grid-cols-2 gap-4 border-t pt-4">

              <div>

                <p className="text-sm text-gray-500">
                  Total Invoices
                </p>

                <p className="text-xl font-bold">
                  {selectedClient.totalInvoices}
                </p>

              </div>


              <div>

                <p className="text-sm text-gray-500">
                  Revenue
                </p>

                <p className="text-xl font-bold text-primary">
                  {formatCurrency(
                    selectedClient.totalRevenue
                  )}
                </p>

              </div>

            </div>

          </div>

        )}

      </Modal>


      {/* EDIT CLIENT MODAL */}

      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Client"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>

            <Button onClick={saveEditedClient}>
              Save Changes
            </Button>
          </>
        }
      >

        <div className="space-y-4">

          <Input
            label="Client Name"
            value={editClient.name}
            onChange={(e) =>
              setEditClient({
                ...editClient,
                name: e.target.value
              })
            }
          />


          <Input
            label="Contact Person"
            value={editClient.contactPerson || ""}
            onChange={(e) =>
              setEditClient({
                ...editClient,
                contactPerson: e.target.value
              })
            }
          />


          <Input
            label="GST Number"
            value={editClient.gstNumber || ""}
            onChange={(e) =>
              setEditClient({
                ...editClient,
                gstNumber: e.target.value
              })
            }
          />


          <Input
            label="Email"
            type="email"
            value={editClient.email}
            onChange={(e) =>
              setEditClient({
                ...editClient,
                email: e.target.value
              })
            }
          />


          <Input
            label="Phone"
            value={editClient.phone}
            onChange={(e) =>
              setEditClient({
                ...editClient,
                phone: e.target.value
              })
            }
          />


          <Input
            label="Address"
            value={editClient.address}
            onChange={(e) =>
              setEditClient({
                ...editClient,
                address: e.target.value
              })
            }
          />

        </div>

      </Modal>


    </div>
  );
};

export default Clients;

