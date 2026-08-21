import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiPackage,
  FiDollarSign,
  FiPercent,
} from "react-icons/fi";

import { api } from "../../utils/axiosInstance";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Dropdown from "../../components/ui/Dropdown";
import SearchBar from "../../components/ui/SearchBar";
import Pagination from "../../components/ui/Pagination";


const Products = () => {
  const { success, error } = useToast();
  const { user } = useAuth();

  // ==========================
  // PRODUCT STATE
  // ==========================

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const [editModalOpen, setEditModalOpen] = useState(false);

  // ==========================
  // SELECTED PRODUCT
  // ==========================

  const [selectedProduct, setSelectedProduct] = useState(null);

  // ==========================
  // ADD PRODUCT FORM
  // ==========================

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    gst_percent: "",
    is_active: true,
  });

  // ==========================
  // EDIT PRODUCT FORM
  // ==========================

  const [editProduct, setEditProduct] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    gst_percent: "",
    is_active: true,
  });

  // ==========================
  // FETCH PRODUCTS
  // ==========================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await api.products.list();

      console.log("PRODUCTS API RESPONSE:", response);
      console.log("PRODUCTS API DATA:", response.data);

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.products || [];

      setProducts(data);

      console.log("PRODUCTS:", data);
    } catch (err) {
      console.error("PRODUCT FETCH ERROR:", err);
      console.error("RESPONSE:", err.response);
      console.error("RESPONSE DATA:", err.response?.data);

      error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ==========================
  // FILTER PRODUCTS
  // ==========================

  const filteredProducts = products.filter((product) => {
    const search = searchQuery.toLowerCase();

    const searchMatch =
      !search ||
      (product.name || "").toLowerCase().includes(search) ||
      (product.description || "").toLowerCase().includes(search);

    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "active" && product.is_active === true) ||
      (statusFilter === "inactive" && product.is_active === false);

    return searchMatch && statusMatch;
  });

  // ==========================
  // PAGINATION
  // ==========================

  const totalPages = Math.ceil(
    filteredProducts.length / itemsPerPage
  );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ==========================
  // FORM RESET
  // ==========================

  const resetNewProduct = () => {
    setNewProduct({
      name: "",
      description: "",
      price: "",
      gst_percent: "",
      is_active: true,
    });
  };

  // ==========================
  // ADD PRODUCT
  // ==========================

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) {
      error("Product name is required");
      return;
    }

    if (!newProduct.price) {
      error("Product price is required");
      return;
    }
    if (Number(newProduct.price) < 0) {
      error("Price cannot be negative");
      return;
    }

    if (
      Number(newProduct.gst_percent) < 0 ||
      Number(newProduct.gst_percent) > 100
    ) {
      error("GST percentage must be between 0 and 100");
      return;
    }

    try {
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        gst_percent: newProduct.gst_percent || 0,
        is_active: newProduct.is_active,
      };

      const response = await api.products.create(productData);

      console.log("CREATED PRODUCT:", response.data);

      setProducts((prevProducts) => [
        ...prevProducts,
        response.data,
      ]);

      success("Product added successfully");

      setAddModalOpen(false);

      resetNewProduct();
    } catch (err) {
      console.error("PRODUCT CREATE ERROR:", err);

      error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to create product"
      );
    }
  };

  // ==========================
  // OPEN EDIT MODAL
  // ==========================

  const handleEditProduct = (product) => {
    setEditProduct({
      id: product.id,
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      gst_percent: product.gst_percent || "",
      is_active: product.is_active,
    });

    setEditModalOpen(true);
  };

  // ==========================
  // UPDATE PRODUCT
  // ==========================

  const handleUpdateProduct = async () => {
    if (!editProduct.name.trim()) {
      error("Product name is required");
      return;
    }

    if (!editProduct.price) {
      error("Product price is required");
      return;
    }

    if (Number(editProduct.price) < 0) {
      error("Price cannot be negative");
      return;
    }

    if (
      Number(editProduct.gst_percent) < 0 ||
      Number(editProduct.gst_percent) > 100
    ) {
      error("GST percentage must be between 0 and 100");
      return;
    }

    try {
      const productData = {
        name: editProduct.name,
        description: editProduct.description,
        price: editProduct.price,
        gst_percent: editProduct.gst_percent || 0,
        is_active: editProduct.is_active,
      };

      const response = await api.products.update(
        editProduct.id,
        productData
      );

      console.log("UPDATED PRODUCT:", response.data);

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === response.data.id
            ? response.data
            : product
        )
      );

      success("Product updated successfully");

      setEditModalOpen(false);
    } catch (err) {
      console.error("PRODUCT UPDATE ERROR:", err);

      error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to update product"
      );
    }
  };

  // ==========================
  // DELETE PRODUCT
  // ==========================

  const handleDeleteProduct = async (product) => {
    const confirmDelete = window.confirm(
      `Delete ${product.name}?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.products.delete(product.id);

      setProducts((prevProducts) =>
        prevProducts.filter(
          (item) => item.id !== product.id
        )
      );

      success("Product deleted successfully");
    } catch (err) {
      console.error("PRODUCT DELETE ERROR:", err);

      error(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to delete product"
      );
    }
  };

  // ==========================
  // FORMAT CURRENCY
  // ==========================

  const currency =
    user?.currency ||
    user?.profile?.currency ||
    "INR";

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  // ==========================
  // CALCULATIONS
  // ==========================

  const totalProducts = products.length;

  const activeProducts = products.filter(
    (product) => product.is_active === true
  ).length;

  const inactiveProducts = products.filter(
    (product) => product.is_active === false
  ).length;

  const totalValue = products.reduce(
    (sum, product) =>
      sum + (Number(product.price) || 0),
    0
  );

  // ==========================
  // RENDER
  // ==========================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Products
          </h1>

          <p className="text-gray-500 dark:text-gray-400">
            Manage your products and services
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          leftIcon={<FiPlus />}
        >
          Add Product
        </Button>

      </div>


      {/* STATS */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Card hover>
          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <FiPackage size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Products
              </p>

              <p className="text-2xl font-bold">
                {totalProducts}
              </p>
            </div>

          </div>
        </Card>


        <Card hover>
          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600">
              <FiPackage size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Active Products
              </p>

              <p className="text-2xl font-bold">
                {activeProducts}
              </p>
            </div>

          </div>
        </Card>


        <Card hover>
          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600">
              <FiPackage size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Inactive Products
              </p>

              <p className="text-2xl font-bold">
                {inactiveProducts}
              </p>
            </div>

          </div>
        </Card>


        <Card hover>
          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600">
              <FiDollarSign size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Value
              </p>

              <p className="text-2xl font-bold">
                {formatCurrency(totalValue)}
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
              onChange={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
              placeholder="Search products..."
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


      {/* LOADING */}

      {loading && (
        <Card className="text-center py-12">
          <p className="text-gray-500">
            Loading products...
          </p>
        </Card>
      )}


      {/* PRODUCT GRID */}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {paginatedProducts.map((product) => (

            <motion.div
              key={product.id}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.3,
              }}
            >

              <Card hover>

                {/* PRODUCT HEADER */}

                <div className="flex justify-between items-start mb-4">

                  <div className="flex items-center gap-3">

                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <FiPackage size={22} />
                    </div>

                    <div>

                      <h3 className="font-semibold">
                        {product.name}
                      </h3>

                      <Badge
                        variant={
                          product.is_active
                            ? "success"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {product.is_active
                          ? "active"
                          : "inactive"}
                      </Badge>

                    </div>

                  </div>


                  {/* DROPDOWN */}

                  <Dropdown
                    trigger={
                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <FiMoreVertical size={18} />
                      </button>
                    }
                    align="right"
                    width="sm"
                  >

                    <Dropdown.Item
                      icon={<FiEdit2 size={16} />}
                      onClick={() =>
                        handleEditProduct(product)
                      }
                    >
                      Edit Product
                    </Dropdown.Item>

                    <Dropdown.Divider />

                    <Dropdown.Item
                      icon={<FiTrash2 size={16} />}
                      className="text-danger"
                      onClick={() =>
                        handleDeleteProduct(product)
                      }
                    >
                      Delete
                    </Dropdown.Item>

                  </Dropdown>

                </div>


                {/* DESCRIPTION */}

                <div className="mb-4">

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {product.description ||
                      "No description"}
                  </p>

                </div>


                {/* PRODUCT DETAILS */}

                <div className="mt-4 pt-4 border-t space-y-3">

                  <div className="flex justify-between items-center">

                    <span className="text-sm text-gray-500">
                      Price
                    </span>

                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(product.price)}
                    </span>

                  </div>


                  <div className="flex justify-between items-center">

                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <FiPercent size={14} />
                      GST
                    </span>

                    <span className="font-medium">
                      {product.gst_percent || 0}%
                    </span>

                  </div>

                </div>

              </Card>

            </motion.div>

          ))}

        </div>
      )}


      {/* EMPTY STATE */}

      {!loading && paginatedProducts.length === 0 && (

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
                No products found
              </p>

              <p className="text-sm text-gray-500">
                Try adjusting your search or filters
              </p>

            </div>

          </div>

        </Card>

      )}


      {/* PAGINATION */}

      {!loading && totalPages > 1 && (

        <div className="flex justify-center">

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />

        </div>

      )}


      {/* ADD PRODUCT MODAL */}

      <Modal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          resetNewProduct();
        }}
        title="Add New Product"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setAddModalOpen(false);
                resetNewProduct();
              }}
            >
              Cancel
            </Button>

            <Button onClick={handleAddProduct}>
              Add Product
            </Button>
          </>
        }
      >

        <div className="space-y-4">

          <Input
            label="Product Name"
            value={newProduct.name}
            placeholder="Website Development"
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                name: e.target.value,
              })
            }
          />


          <Input
            label="Description"
            value={newProduct.description}
            placeholder="Product description"
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                description: e.target.value,
              })
            }
          />


          <Input
            label="Price"
            type="number"
            min='0'
            value={newProduct.price}
            placeholder="10000"
            onChange={(e) => {
              const value = e.target.value;

              if (value === "" || Number(value) >= 0) {
                setNewProduct({
                  ...newProduct,
                  price: value,
                });
              }
            }}
          />


          <Input
            label="GST Percentage"
            type="number"
            min='0'
            max='100'
            value={newProduct.gst_percent}
            placeholder="18"
            onChange={(e) => {
              const value = e.target.value;

              if (
                value === "" ||
                (Number(value) >= 0 && Number(value) <= 100)
              ) {
                setNewProduct({
                  ...newProduct,
                  gst_percent: value,
                });
              }
            }}
          />

        </div>

      </Modal>


      {/* EDIT PRODUCT MODAL */}

      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Product"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>

            <Button onClick={handleUpdateProduct}>
              Save Changes
            </Button>
          </>
        }
      >

        <div className="space-y-4">

          <Input
            label="Product Name"
            value={editProduct.name}
            onChange={(e) =>
              setEditProduct({
                ...editProduct,
                name: e.target.value,
              })
            }
          />


          <Input
            label="Description"
            value={editProduct.description}
            onChange={(e) =>
              setEditProduct({
                ...editProduct,
                description: e.target.value,
              })
            }
          />


          <Input
            label="Price"
            type="number"
            min='0'
            value={editProduct.price}
            onChange={(e) => {
              const value = e.target.value;

              if (value === "" || Number(value) >= 0) {
                setEditProduct({
                  ...editProduct,
                  price: value,
                });
              }
            }}
          />


          <Input
            label="GST Percentage"
            type="number"
            min='0'
            max='100'
            value={editProduct.gst_percent}
            onChange={(e) => {
              const value = e.target.value;

              if (
                value === "" ||
                (Number(value) >= 0 && Number(value) <= 100)
              ) {
                setEditProduct({
                  ...editProduct,
                  gst_percent: value,
                });
              }
            }}
          />


          <div>

            <label className="block text-sm font-medium mb-2">
              Status
            </label>

            <select
              value={
                editProduct.is_active
                  ? "active"
                  : "inactive"
              }
              onChange={(e) =>
                setEditProduct({
                  ...editProduct,
                  is_active:
                    e.target.value === "active",
                })
              }
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card"
            >

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

            </select>

          </div>

        </div>

      </Modal>

    </div>
  );
};

export default Products;
