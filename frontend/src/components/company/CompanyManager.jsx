import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiCheck,
    FiX,
    FiBriefcase,
    FiGlobe,
    FiPhone,
    FiMapPin,
} from 'react-icons/fi';

import { useProfile } from '../../context/ProfileContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

const CompanyManager = () => {
    const navigate = useNavigate();
    const {
        companies,
        activeCompanyId,
        setActiveCompany,
        createCompany,
        updateProfile,
        deleteCompany,
    } = useProfile();

    const [showForm, setShowForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [formData, setFormData] = useState({
        company: '',
        businessName: '',
        businessType: '',
        website: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'India',
        taxId: '',
        gstNumber: '',
        panNumber: '',
        registrationNumber: '',
        invoicePrefix: 'INV-',
        invoiceStartingNumber: 1001,
        currency: 'INR',
        paymentTerms: 'Net 30',
        invoiceNotes: '',
        invoiceTerms: '',
    });

    // =========================================================
    // FORM HANDLERS
    // =========================================================

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const resetForm = () => {
        setFormData({
            company: '',
            businessName: '',
            businessType: '',
            website: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            country: 'India',
            taxId: '',
            gstNumber: '',
            panNumber: '',
            registrationNumber: '',
            invoicePrefix: 'INV-',
            invoiceStartingNumber: 1001,
            currency: 'INR',
            paymentTerms: 'Net 30',
            invoiceNotes: '',
            invoiceTerms: '',
        });

        setEditingCompany(null);
        setShowForm(false);
    };

    // =========================================================
    // ADD COMPANY
    // =========================================================

    const handleAddCompany = () => {
        resetForm();
        setShowForm(true);
    };

    // =========================================================
    // EDIT COMPANY
    // =========================================================

    const handleEditCompany = (company) => {
        setEditingCompany(company);

        setFormData({
            company: company.company || company.business_name || '',
            businessName:
                company.business_name ||
                company.company ||
                '',
            businessType: company.business_type || '',
            website: company.website || '',
            phone: company.phone || '',
            address: company.address || '',
            city: company.city || '',
            state: company.state || '',
            zip: company.zip || '',
            country: company.country || 'India',

            taxId: company.tax_id || '',
            gstNumber: company.gst_number || '',
            panNumber: company.pan_number || '',
            registrationNumber:
                company.registration_number || '',

            invoicePrefix:
                company.invoice_prefix || 'INV-',

            invoiceStartingNumber:
                company.invoice_starting_number || 1001,

            currency:
                company.currency || 'INR',

            paymentTerms:
                company.payment_terms || 'Net 30',

            invoiceNotes:
                company.invoice_notes || '',

            invoiceTerms:
                company.invoice_terms || '',
        });

        setShowForm(true);
    };

    // =========================================================
    // SAVE COMPANY
    // =========================================================

    const handleSaveCompany = async () => {
        const companyName =
            formData.businessName.trim() ||
            formData.company.trim();

        if (!companyName) {
            alert('Please enter a company name.');
            return;
        }

        try {
            setSaving(true);

            const payload = {
                ...formData,
                company: companyName,
                businessName: companyName,
            };

            if (editingCompany) {
                await updateProfile(payload);
            } else {
                await createCompany(payload);
            }

            resetForm();
        } catch (error) {
            console.error('Failed to save company:', error);

            alert(
                error?.response?.data?.detail ||
                'Failed to save company. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // SWITCH COMPANY
    // =========================================================

    const handleSelectCompany = (company) => {
        setActiveCompany(company.id);
    };

    // =========================================================
    // DELETE COMPANY
    // =========================================================

    const handleDeleteCompany = async (company) => {
        if (companies.length <= 1) {
            alert(
                'You must keep at least one company.'
            );
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete "${company.business_name || company.company}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(company.id);

            await deleteCompany(company.id);
        } catch (error) {
            console.error(
                'Failed to delete company:',
                error
            );

            alert(
                error?.response?.data?.detail ||
                'Failed to delete company. Please try again.'
            );
        } finally {
            setDeletingId(null);
        }
    };

    // =========================================================
    // FORM VIEW
    // =========================================================

    if (showForm) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-dark-card rounded-2xl shadow-2xl">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">

                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {editingCompany
                                    ? 'Edit Company'
                                    : 'Add New Company'}
                            </h2>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Add business information used on your invoices.
                            </p>
                        </div>

                        <button
                            onClick={resetForm}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                        >
                            <FiX size={20} />
                        </button>

                    </div>

                    {/* Form */}
                    <div className="p-6 space-y-6">

                        {/* Business Identity */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Business Identity
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <Input
                                    label="Company Name"
                                    value={formData.businessName}
                                    onChange={(e) =>
                                        handleChange(
                                            'businessName',
                                            e.target.value
                                        )
                                    }
                                    leftIcon={<FiBriefcase size={18} />}
                                    placeholder="Company name"
                                />

                                <Input
                                    label="Business Type"
                                    value={formData.businessType}
                                    onChange={(e) =>
                                        handleChange(
                                            'businessType',
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g. Company, Agency, Freelancer"
                                />

                                <Input
                                    label="Website"
                                    value={formData.website}
                                    onChange={(e) =>
                                        handleChange(
                                            'website',
                                            e.target.value
                                        )
                                    }
                                    leftIcon={<FiGlobe size={18} />}
                                    placeholder="https://example.com"
                                />

                                <Input
                                    label="Phone"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        handleChange(
                                            'phone',
                                            e.target.value
                                        )
                                    }
                                    leftIcon={<FiPhone size={18} />}
                                    placeholder="+91..."
                                />

                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Business Address
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="md:col-span-2">
                                    <Input
                                        label="Address"
                                        value={formData.address}
                                        onChange={(e) =>
                                            handleChange(
                                                'address',
                                                e.target.value
                                            )
                                        }
                                        leftIcon={<FiMapPin size={18} />}
                                        placeholder="Street address"
                                    />
                                </div>

                                <Input
                                    label="City"
                                    value={formData.city}
                                    onChange={(e) =>
                                        handleChange(
                                            'city',
                                            e.target.value
                                        )
                                    }
                                    placeholder="City"
                                />

                                <Input
                                    label="State"
                                    value={formData.state}
                                    onChange={(e) =>
                                        handleChange(
                                            'state',
                                            e.target.value
                                        )
                                    }
                                    placeholder="State"
                                />

                                <Input
                                    label="ZIP / Postal Code"
                                    value={formData.zip}
                                    onChange={(e) =>
                                        handleChange(
                                            'zip',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Postal code"
                                />

                                <Input
                                    label="Country"
                                    value={formData.country}
                                    onChange={(e) =>
                                        handleChange(
                                            'country',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Country"
                                />

                            </div>
                        </div>

                        {/* Tax */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Tax & Legal
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <Input
                                    label="GST Number"
                                    value={formData.gstNumber}
                                    onChange={(e) =>
                                        handleChange(
                                            'gstNumber',
                                            e.target.value
                                        )
                                    }
                                    placeholder="GSTIN"
                                />

                                <Input
                                    label="PAN Number"
                                    value={formData.panNumber}
                                    onChange={(e) =>
                                        handleChange(
                                            'panNumber',
                                            e.target.value
                                        )
                                    }
                                    placeholder="PAN"
                                />

                                <Input
                                    label="Tax ID"
                                    value={formData.taxId}
                                    onChange={(e) =>
                                        handleChange(
                                            'taxId',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Tax ID"
                                />

                                <Input
                                    label="Registration Number"
                                    value={formData.registrationNumber}
                                    onChange={(e) =>
                                        handleChange(
                                            'registrationNumber',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Registration number"
                                />

                            </div>
                        </div>

                        {/* Invoice Settings */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Invoice Settings
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <Input
                                    label="Invoice Prefix"
                                    value={formData.invoicePrefix}
                                    onChange={(e) =>
                                        handleChange(
                                            'invoicePrefix',
                                            e.target.value
                                        )
                                    }
                                    placeholder="INV-"
                                />

                                <Input
                                    label="Starting Number"
                                    type="number"
                                    value={
                                        formData.invoiceStartingNumber
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            'invoiceStartingNumber',
                                            e.target.value
                                        )
                                    }
                                    placeholder="1001"
                                />

                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">

                        <Button
                            variant="secondary"
                            onClick={resetForm}
                            disabled={saving}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleSaveCompany}
                            disabled={saving}
                            leftIcon={<FiCheck size={18} />}
                        >
                            {saving
                                ? 'Saving...'
                                : editingCompany
                                    ? 'Update Company'
                                    : 'Create Company'}
                        </Button>

                    </div>

                </div>
            </div>
        );
    }

    // =========================================================
    // COMPANY LIST
    // =========================================================

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-dark-card rounded-2xl shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Manage Companies
                        </h2>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Switch between your businesses or add a new one.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                    >
                        <FiX size={20} />
                    </button>

                </div>

                {/* Content */}
                <div className="p-6">

                    {companies.length === 0 ? (
                        <div className="text-center py-10">

                            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <FiBriefcase size={26} />
                            </div>

                            <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">
                                No companies yet
                            </h3>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Create your first company to start creating invoices.
                            </p>

                        </div>
                    ) : (
                        <div className="space-y-3">

                            {companies.map((company) => {

                                const isActive =
                                    String(company.id) ===
                                    String(activeCompanyId);

                                const companyName =
                                    company.business_name ||
                                    company.businessName ||
                                    company.company ||
                                    'Unnamed Company';

                                return (
                                    <div
                                        key={company.id}
                                        className={`p-4 rounded-xl border transition-colors ${isActive
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                    >

                                        <div className="flex items-start justify-between gap-4">

                                            <div className="flex items-start gap-3 min-w-0">

                                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <FiBriefcase size={19} />
                                                </div>

                                                <div className="min-w-0">

                                                    <div className="flex items-center gap-2">

                                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                            {companyName}
                                                        </h3>

                                                        {isActive && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-white shrink-0">
                                                                Active
                                                            </span>
                                                        )}

                                                    </div>

                                                    {company.city && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {company.city}
                                                            {company.state
                                                                ? `, ${company.state}`
                                                                : ''}
                                                        </p>
                                                    )}

                                                    {company.email && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {company.email}
                                                        </p>
                                                    )}

                                                </div>

                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">

                                                {!isActive && (
                                                    <button
                                                        onClick={() =>
                                                            handleSelectCompany(
                                                                company
                                                            )
                                                        }
                                                        title="Switch company"
                                                        className="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10"
                                                    >
                                                        <FiCheck size={17} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() =>
                                                        handleEditCompany(
                                                            company
                                                        )
                                                    }
                                                    title="Edit company"
                                                    className="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10"
                                                >
                                                    <FiEdit2 size={17} />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDeleteCompany(
                                                            company
                                                        )
                                                    }
                                                    disabled={
                                                        deletingId === company.id
                                                    }
                                                    title="Delete company"
                                                    className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                                                >
                                                    <FiTrash2 size={17} />
                                                </button>

                                            </div>

                                        </div>

                                    </div>
                                );
                            })}

                        </div>
                    )}

                    {/* Add Company */}
                    <div className="mt-5">

                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={handleAddCompany}
                            leftIcon={<FiPlus size={18} />}
                        >
                            Add New Company
                        </Button>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default CompanyManager;