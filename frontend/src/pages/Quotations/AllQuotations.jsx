import { useState, useMemo, useEffect } from 'react';
import {
    Link,
    useNavigate,
    useSearchParams,
} from 'react-router-dom';

import React from 'react';

import { api } from '../../utils/axiosInstance';

import {
    FiSearch,
    FiPlus,
    FiDownload,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiChevronDown,
    FiMail,
} from 'react-icons/fi';

import { useToast } from '../../context/ToastContext';

import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import Modal from '../../components/ui/Modal';

import {
    formatCurrency,
    formatDate,
} from '../../utils/helper';


// =========================================================
// MAP QUOTATION
// =========================================================

const mapQuotation = (quotation) => {

    const client = quotation?.client || {};

    const mappedQuotation = {
        id: quotation.id,

        quotationNumber:
            quotation.quotation_number ||
            `QT-${quotation.id}`,

        clientId: quotation.client_id,

        client:
            client.company_name ||
            client.contact_person ||
            `Client #${quotation.client_id}`,

        email:
            client.email || '',

        amount:
            Number(quotation.grand_total || 0),

        currency:
            quotation.currency ||
            'INR',

        date:
            quotation.quotation_date,

        validUntil:
            quotation.valid_until,

        subtotal:
            Number(quotation.subtotal || 0),

        discount:
            Number(quotation.discount || 0),

        taxAmount:
            Number(quotation.tax_amount || 0),

        grandTotal:
            Number(quotation.grand_total || 0),

        notes:
            quotation.notes || '',

        terms:
            quotation.terms || '',

        items:
            quotation.items || [],

        pdfFilename:
            quotation.pdf_filename || null,
    };


    return {
        ...mappedQuotation,

        searchText: [
            mappedQuotation.quotationNumber,
            mappedQuotation.client,
            mappedQuotation.email,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase(),
    };
};


// =========================================================
// ALL QUOTATIONS
// =========================================================

const AllQuotations = () => {

    const navigate = useNavigate();

    const {
        success,
        error,
    } = useToast();


    const [quotations, setQuotations] = useState([]);

    const [loading, setLoading] = useState(true);

    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams();


    const [
        searchQuery,
        setSearchQuery,
    ] = useState(
        searchParams.get('search') || ''
    );


    const [
        dateRange,
        setDateRange,
    ] = useState('all');


    const [
        quotationFilter,
        setQuotationFilter,
    ] = useState('all');


    const [
        currentPage,
        setCurrentPage,
    ] = useState(1);


    const [
        openActionMenu,
        setOpenActionMenu,
    ] = useState(null);


    const [
        deleteModalOpen,
        setDeleteModalOpen,
    ] = useState(false);


    const [
        quotationToDelete,
        setQuotationToDelete,
    ] = useState(null);


    const [
        downloadingQuotationId,
        setDownloadingQuotationId,
    ] = useState(null);

    const [
        sendingQuotationId,
        setSendingQuotationId,
    ] = useState(null);

    const itemsPerPage = 10;


    // =======================================================
    // FETCH QUOTATIONS
    // =======================================================

    useEffect(() => {

        fetchQuotations();


        const handleQuotationUpdated = () => {
            fetchQuotations();
        };


        window.addEventListener(
            'quotationUpdated',
            handleQuotationUpdated
        );


        return () => {

            window.removeEventListener(
                'quotationUpdated',
                handleQuotationUpdated
            );

        };

    }, []);


    // =======================================================
    // SEARCH PARAMS
    // =======================================================

    useEffect(() => {

        const search =
            searchParams.get('search') || '';

        setSearchQuery(search);

    }, [searchParams]);


    // =======================================================
    // FETCH DATA
    // =======================================================

    const fetchQuotations = async () => {

        try {

            setLoading(true);


            const response =
                await api.quotations.list();


            console.log(
                'QUOTATIONS API DATA:',
                response.data
            );


            const quotationData =
                Array.isArray(response.data)
                    ? response.data
                    : [];


            const mappedQuotations =
                quotationData.map(mapQuotation);


            console.log(
                'MAPPED QUOTATIONS:',
                mappedQuotations
            );


            setQuotations(mappedQuotations);

        } catch (err) {

            console.error(
                'FAILED TO FETCH QUOTATIONS:',
                err
            );

            console.error(
                'ERROR RESPONSE:',
                err?.response
            );


            error(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to load quotations'
            );

        } finally {

            setLoading(false);

        }

    };


    // =======================================================
    // CLOSE ACTION MENU
    // =======================================================

    useEffect(() => {

        const handleClickOutside = () => {

            if (openActionMenu !== null) {
                setOpenActionMenu(null);
            }

        };


        document.addEventListener(
            'click',
            handleClickOutside
        );


        return () => {

            document.removeEventListener(
                'click',
                handleClickOutside
            );

        };

    }, [openActionMenu]);


    // =======================================================
    // SEARCH NORMALIZATION
    // =======================================================

    const normalizeSearch = (value) => {

        return String(value || '')
            .toLowerCase()
            .replace(/[\s-]/g, '');

    };


    // =======================================================
    // DATE RANGE
    // =======================================================

    const isDateInRange = (
        date,
        range
    ) => {

        if (!date || range === 'all') {
            return true;
        }


        const quotationDate =
            new Date(date);

        const today =
            new Date();


        quotationDate.setHours(
            0,
            0,
            0,
            0
        );

        today.setHours(
            0,
            0,
            0,
            0
        );


        switch (range) {

            case 'today':

                return (
                    quotationDate.getTime() ===
                    today.getTime()
                );


            case 'week': {

                const startOfWeek =
                    new Date(today);

                const day =
                    today.getDay();

                const diff =
                    day === 0
                        ? 6
                        : day - 1;


                startOfWeek.setDate(
                    today.getDate() - diff
                );

                startOfWeek.setHours(
                    0,
                    0,
                    0,
                    0
                );


                return (
                    quotationDate >= startOfWeek &&
                    quotationDate <= today
                );

            }


            case 'month':

                return (
                    quotationDate.getMonth() ===
                    today.getMonth() &&
                    quotationDate.getFullYear() ===
                    today.getFullYear() &&
                    quotationDate <= today
                );


            case 'quarter': {

                const currentQuarter =
                    Math.floor(
                        today.getMonth() / 3
                    );


                const startOfQuarter =
                    new Date(
                        today.getFullYear(),
                        currentQuarter * 3,
                        1
                    );


                return (
                    quotationDate >=
                    startOfQuarter &&
                    quotationDate <= today
                );

            }


            case 'year':

                return (
                    quotationDate.getFullYear() ===
                    today.getFullYear() &&
                    quotationDate <= today
                );


            default:
                return true;

        }

    };


    // =======================================================
    // QUOTATION STATUS
    //
    // Backend quotation model currently does not have a
    // status field, so status is derived from valid_until.
    // =======================================================

    const getQuotationStatus = (
        quotation
    ) => {

        if (!quotation.validUntil) {
            return 'no_expiry';
        }


        const today =
            new Date();

        const validUntil =
            new Date(
                quotation.validUntil
            );


        today.setHours(
            0,
            0,
            0,
            0
        );

        validUntil.setHours(
            0,
            0,
            0,
            0
        );


        if (validUntil < today) {
            return 'expired';
        }


        return 'valid';

    };


    // =======================================================
    // STATUS BADGE
    // =======================================================

    const getStatusBadge = (
        quotation
    ) => {

        const status =
            getQuotationStatus(
                quotation
            );


        const statusMap = {

            valid: {
                variant: 'success',
                label: 'Valid',
            },

            expired: {
                variant: 'danger',
                label: 'Expired',
            },

            no_expiry: {
                variant: 'neutral',
                label: 'No Expiry',
            },

        };


        const config =
            statusMap[status] || {
                variant: 'neutral',
                label: 'Unknown',
            };


        return (
            <Badge variant={config.variant}>
                {config.label}
            </Badge>
        );

    };


    // =======================================================
    // FILTER + SEARCH
    // =======================================================

    const filteredQuotations = useMemo(() => {

        const query =
            normalizeSearch(searchQuery);


        return quotations.filter(
            (quotation) => {

                // -----------------------------------------------
                // SEARCH
                // -----------------------------------------------

                const searchableValues = [
                    quotation.quotationNumber,
                    quotation.client,
                    quotation.email,
                ];


                const matchesTextSearch =
                    query === '' ||
                    searchableValues.some(
                        (value) =>
                            normalizeSearch(value)
                                .includes(query)
                    );


                const status =
                    getQuotationStatus(
                        quotation
                    );


                const matchesStatusSearch =
                    query === '' ||
                    normalizeSearch(status)
                    === query;


                const matchesSearch =
                    query === '' ||
                    matchesTextSearch ||
                    matchesStatusSearch;


                // -----------------------------------------------
                // STATUS FILTER
                // -----------------------------------------------

                const matchesStatus =
                    quotationFilter === 'all' ||
                    status === quotationFilter;


                // -----------------------------------------------
                // DATE FILTER
                // -----------------------------------------------

                const matchesDate =
                    isDateInRange(
                        quotation.date,
                        dateRange
                    );


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesDate
                );

            }
        );

    }, [
        quotations,
        searchQuery,
        quotationFilter,
        dateRange,
    ]);


    // =======================================================
    // PAGINATION
    // =======================================================

    const totalPages =
        Math.ceil(
            filteredQuotations.length /
            itemsPerPage
        );


    const paginatedQuotations =
        filteredQuotations.slice(
            (currentPage - 1) *
            itemsPerPage,

            currentPage *
            itemsPerPage
        );


    // =======================================================
    // DELETE
    // =======================================================

    const handleDelete = (
        quotation
    ) => {

        setQuotationToDelete(
            quotation
        );

        setDeleteModalOpen(true);

    };


    const confirmDelete = async () => {

        if (!quotationToDelete?.id) {
            return;
        }


        try {

            await api.quotations.delete(
                quotationToDelete.id
            );


            setQuotations(
                (currentQuotations) =>
                    currentQuotations.filter(
                        (quotation) =>
                            quotation.id !==
                            quotationToDelete.id
                    )
            );


            success(
                `Quotation ${quotationToDelete.quotationNumber} deleted successfully`
            );


            setDeleteModalOpen(false);

            setQuotationToDelete(null);

            setOpenActionMenu(null);

        } catch (err) {

            console.error(
                'FAILED TO DELETE QUOTATION:',
                err
            );


            console.error(
                'DELETE RESPONSE:',
                err?.response
            );


            error(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to delete quotation'
            );

        }

    };


    // =======================================================
    // DOWNLOAD PDF
    // =======================================================

    const handleDownload = async (
        quotation
    ) => {

        if (!quotation?.id) {
            return;
        }


        try {

            setDownloadingQuotationId(
                quotation.id
            );


            /*
             * Generate the latest PDF before downloading.
             */

            await api.quotations.generatePdf(
                quotation.id
            );


            const response =
                await api.quotations.downloadPdf(
                    quotation.id
                );


            const blob =
                new Blob(
                    [response.data],
                    {
                        type: 'application/pdf',
                    }
                );


            const url =
                window.URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement('a');


            link.href = url;


            link.download =
                quotation.pdfFilename ||
                `Quotation-${quotation.quotationNumber}.pdf`;


            document.body.appendChild(
                link
            );


            link.click();


            document.body.removeChild(
                link
            );


            window.URL.revokeObjectURL(
                url
            );


            success(
                'Quotation downloaded successfully'
            );


            setOpenActionMenu(null);

        } catch (err) {

            console.error(
                'FAILED TO DOWNLOAD QUOTATION:',
                err
            );


            error(
                err?.response?.data?.detail ||
                'Failed to download quotation'
            );

        } finally {

            setDownloadingQuotationId(
                null
            );

        }

    };

    // =======================================================
    // SEND QUOTATION
    // =======================================================

    const handleSendQuotation = async (
        quotation
    ) => {
        if (
            !quotation?.id ||
            sendingQuotationId === quotation.id
        ) {
            return;
        }

        try {
            setSendingQuotationId(
                quotation.id
            );

            const response =
                await api.quotations.send(
                    quotation.id
                );

            const recipient =
                response?.data?.recipient ||
                quotation.email;

            success(
                `Quotation ${quotation.quotationNumber} sent successfully to ${recipient}.`,
                3000
            );

            setOpenActionMenu(null);

        } catch (err) {

            console.error(
                'FAILED TO SEND QUOTATION:',
                err
            );

            error(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to send quotation.',
                3000
            );

        } finally {

            setSendingQuotationId(
                null
            );

        }
    };

    // =======================================================
    // EXPORT CSV
    // =======================================================

    const handleExport = () => {

        try {

            if (
                filteredQuotations.length === 0
            ) {

                error(
                    'No quotations available to export'
                );

                return;

            }


            const headers = [
                'Quotation Number',
                'Client Name',
                'Client Email',
                'Amount',
                'Quotation Status',
                'Quotation Date',
                'Valid Until',
                'Subtotal',
                'Discount',
                'Tax Amount',
                'Notes',
            ];


            const rows =
                filteredQuotations.map(
                    (quotation) => [
                        quotation.quotationNumber ||
                        '',

                        quotation.client ||
                        '',

                        quotation.email ||
                        '',

                        quotation.amount ||
                        0,

                        getQuotationStatus(
                            quotation
                        ),

                        quotation.date ||
                        '',

                        quotation.validUntil ||
                        '',

                        quotation.subtotal ||
                        0,

                        quotation.discount ||
                        0,

                        quotation.taxAmount ||
                        0,

                        quotation.notes ||
                        '',
                    ]
                );


            const escapeCSV = (
                value
            ) => {

                const stringValue =
                    String(value ?? '');


                if (
                    stringValue.includes(',') ||
                    stringValue.includes('"') ||
                    stringValue.includes('\n')
                ) {

                    return `"${stringValue.replace(
                        /"/g,
                        '""'
                    )}"`;

                }


                return stringValue;

            };


            const csvContent = [
                headers
                    .map(escapeCSV)
                    .join(','),

                ...rows.map(
                    (row) =>
                        row
                            .map(escapeCSV)
                            .join(',')
                ),

            ].join('\n');


            const blob =
                new Blob(
                    ['\uFEFF' + csvContent],
                    {
                        type:
                            'text/csv;charset=utf-8;',
                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement('a');


            link.href = url;


            const today =
                new Date()
                    .toISOString()
                    .split('T')[0];


            link.download =
                `quotations_${today}.csv`;


            document.body.appendChild(
                link
            );


            link.click();


            document.body.removeChild(
                link
            );


            URL.revokeObjectURL(
                url
            );


            success(
                `${filteredQuotations.length} quotation${filteredQuotations.length !== 1
                    ? 's'
                    : ''
                } exported successfully`
            );

        } catch (err) {

            console.error(
                'EXPORT ERROR:',
                err
            );

            error(
                'Failed to export quotations'
            );

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
                        Loading quotations...
                    </p>

                </div>

            </div>
        );

    }


    // =======================================================
    // RENDER
    // =======================================================

    return (
        <div className="space-y-6">

            {/* =================================================
          HEADER
      ================================================= */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Quotation History
                    </h1>

                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage and track all your quotations
                    </p>

                </div>


                <div className="flex items-center gap-3">

                    <Button
                        variant="secondary"
                        leftIcon={
                            <FiDownload size={18} />
                        }
                        onClick={handleExport}
                    >
                        Export
                    </Button>


                    <Link to="/quotation/create">

                        <Button
                            leftIcon={
                                <FiPlus size={18} />
                            }
                        >
                            New Quotation
                        </Button>

                    </Link>

                </div>

            </div>


            {/* =================================================
          QUOTATION STATUS
      ================================================= */}

            <div>

                <div className="flex items-center justify-between mb-3">

                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Quotation Status
                    </h2>


                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Total: {quotations.length}
                    </span>

                </div>


                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                    {/* TOTAL */}

                    <Card
                        hover
                        className="text-center"
                    >

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            Total
                        </p>

                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {quotations.length}
                        </p>

                    </Card>


                    {/* VALID */}

                    <Card
                        hover
                        className="text-center"
                    >

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            Valid
                        </p>

                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">

                            {
                                quotations.filter(
                                    (quotation) =>
                                        getQuotationStatus(
                                            quotation
                                        ) === 'valid'
                                ).length
                            }

                        </p>

                    </Card>


                    {/* EXPIRED */}

                    <Card
                        hover
                        className="text-center"
                    >

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            Expired
                        </p>

                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">

                            {
                                quotations.filter(
                                    (quotation) =>
                                        getQuotationStatus(
                                            quotation
                                        ) === 'expired'
                                ).length
                            }

                        </p>

                    </Card>


                    {/* NO EXPIRY */}

                    <Card
                        hover
                        className="text-center"
                    >

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            No Expiry
                        </p>

                        <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">

                            {
                                quotations.filter(
                                    (quotation) =>
                                        getQuotationStatus(
                                            quotation
                                        ) === 'no_expiry'
                                ).length
                            }

                        </p>

                    </Card>

                </div>

            </div>


            {/* =================================================
          FILTERS
      ================================================= */}

            <Card>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

                    <div className="w-full md:w-96">

                        <SearchBar
                            value={searchQuery}
                            onChange={(value) => {

                                setSearchQuery(value);

                                setCurrentPage(1);

                                setSearchParams(
                                    value
                                        ? { search: value }
                                        : {}
                                );

                            }}
                            placeholder="Search by quotation number, client, or email..."
                        />

                    </div>


                    <div className="flex flex-wrap gap-3 w-full md:w-auto">

                        <Select
                            value={quotationFilter}
                            onChange={(e) => {

                                setQuotationFilter(
                                    e.target.value
                                );

                                setCurrentPage(1);

                            }}
                            options={[
                                {
                                    value: 'all',
                                    label: 'All Quotation Status',
                                },
                                {
                                    value: 'valid',
                                    label: 'Valid',
                                },
                                {
                                    value: 'expired',
                                    label: 'Expired',
                                },
                                {
                                    value: 'no_expiry',
                                    label: 'No Expiry',
                                },
                            ]}
                            className="w-44"
                        />


                        <Select
                            value={dateRange}
                            onChange={(e) => {

                                setDateRange(
                                    e.target.value
                                );

                                setCurrentPage(1);

                            }}
                            options={[
                                {
                                    value: 'all',
                                    label: 'All Time',
                                },
                                {
                                    value: 'today',
                                    label: 'Today',
                                },
                                {
                                    value: 'week',
                                    label: 'This Week',
                                },
                                {
                                    value: 'month',
                                    label: 'This Month',
                                },
                                {
                                    value: 'quarter',
                                    label: 'This Quarter',
                                },
                                {
                                    value: 'year',
                                    label: 'This Year',
                                },
                            ]}
                            className="w-40"
                        />

                    </div>

                </div>

            </Card>


            {/* =================================================
          QUOTATION TABLE
      ================================================= */}

            <Card padding={false}>

                <div className="overflow-x-auto overflow-y-visible">

                    <Table>

                        <Table.Head>

                            <Table.Row>

                                <Table.Header>
                                    Quotation Id
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
                                    Quotation Date
                                </Table.Header>

                                <Table.Header>
                                    Valid Until
                                </Table.Header>

                                <Table.Header align="right">
                                    Actions
                                </Table.Header>

                            </Table.Row>

                        </Table.Head>


                        <Table.Body>

                            {paginatedQuotations.length > 0 ? (

                                paginatedQuotations.map(
                                    (quotation) => (

                                        <Table.Row
                                            key={quotation.id}
                                            clickable
                                        >

                                            {/* =================================
                          QUOTATION NUMBER
                      ================================= */}

                                            <Table.Cell>

                                                <Link
                                                    to={`/quotations/${quotation.id}/view`}
                                                    className="text-sm font-medium text-primary hover:text-primary-dark"
                                                >
                                                    {quotation.quotationNumber}
                                                </Link>

                                            </Table.Cell>


                                            {/* =================================
                          CLIENT
                      ================================= */}

                                            <Table.Cell>

                                                <div>

                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        {quotation.client}
                                                    </p>

                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {quotation.email}
                                                    </p>

                                                </div>

                                            </Table.Cell>


                                            {/* =================================
                          AMOUNT
                      ================================= */}

                                            <Table.Cell>

                                                <span className="font-semibold text-gray-900 dark:text-gray-100">

                                                    {formatCurrency(
                                                        quotation.amount,
                                                        quotation.currency
                                                    )}

                                                </span>

                                            </Table.Cell>


                                            {/* =================================
                          STATUS
                      ================================= */}

                                            <Table.Cell>

                                                {getStatusBadge(
                                                    quotation
                                                )}

                                            </Table.Cell>


                                            {/* =================================
                          DATE
                      ================================= */}

                                            <Table.Cell className="text-gray-500 dark:text-gray-400">

                                                {formatDate(
                                                    quotation.date
                                                )}

                                            </Table.Cell>


                                            {/* =================================
                          VALID UNTIL
                      ================================= */}

                                            <Table.Cell className="text-gray-500 dark:text-gray-400">

                                                {quotation.validUntil
                                                    ? formatDate(
                                                        quotation.validUntil
                                                    )
                                                    : 'No expiry date'}

                                            </Table.Cell>


                                            {/* =================================
                          ACTIONS
                      ================================= */}

                                            <Table.Cell align="right">

                                                <div className="relative flex items-center justify-end">


                                                    {/* ACTION MENU */}

                                                    {openActionMenu ===
                                                        quotation.id && (

                                                            <div
                                                                className="absolute right-10 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >

                                                                {/* VIEW */}

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        navigate(
                                                                            `/quotations/${quotation.id}/view`
                                                                        )
                                                                    }
                                                                    title="View quotation"
                                                                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                                                                >

                                                                    <FiEye
                                                                        size={16}
                                                                    />

                                                                </button>


                                                                {/* EDIT */}

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        navigate(
                                                                            `/quotations/${quotation.id}/edit`
                                                                        )
                                                                    }
                                                                    title="Edit quotation"
                                                                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                                                                >

                                                                    <FiEdit2
                                                                        size={16}
                                                                    />

                                                                </button>


                                                                {/* DOWNLOAD */}

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDownload(
                                                                            quotation
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        downloadingQuotationId ===
                                                                        quotation.id
                                                                    }
                                                                    title={
                                                                        downloadingQuotationId ===
                                                                            quotation.id
                                                                            ? 'Downloading quotation...'
                                                                            : 'Download quotation'
                                                                    }
                                                                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >

                                                                    {downloadingQuotationId ===
                                                                        quotation.id ? (

                                                                        <svg
                                                                            className="animate-spin h-4 w-4"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                        >

                                                                            <circle
                                                                                className="opacity-25"
                                                                                cx="12"
                                                                                cy="12"
                                                                                r="10"
                                                                                stroke="currentColor"
                                                                                strokeWidth="4"
                                                                            />

                                                                            <path
                                                                                className="opacity-75"
                                                                                fill="currentColor"
                                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                            />

                                                                        </svg>

                                                                    ) : (

                                                                        <FiDownload
                                                                            size={16}
                                                                        />

                                                                    )}

                                                                </button>

                                                                {/* SEND QUOTATION */}

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleSendQuotation(
                                                                            quotation
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        sendingQuotationId ===
                                                                        quotation.id
                                                                    }
                                                                    title={
                                                                        sendingQuotationId ===
                                                                            quotation.id
                                                                            ? 'Sending quotation...'
                                                                            : quotation.email
                                                                                ? `Send quotation to ${quotation.email}`
                                                                                : 'Client email not available'
                                                                    }
                                                                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {sendingQuotationId ===
                                                                        quotation.id ? (

                                                                        <svg
                                                                            className="animate-spin h-4 w-4"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                        >
                                                                            <circle
                                                                                className="opacity-25"
                                                                                cx="12"
                                                                                cy="12"
                                                                                r="10"
                                                                                stroke="currentColor"
                                                                                strokeWidth="4"
                                                                            />

                                                                            <path
                                                                                className="opacity-75"
                                                                                fill="currentColor"
                                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                            />
                                                                        </svg>

                                                                    ) : (

                                                                        <FiMail
                                                                            size={16}
                                                                        />

                                                                    )}
                                                                </button>


                                                                {/* DELETE */}

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            quotation
                                                                        )
                                                                    }
                                                                    title="Delete quotation"
                                                                    className="p-2 text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                                >

                                                                    <FiTrash2
                                                                        size={16}
                                                                    />

                                                                </button>

                                                            </div>

                                                        )}


                                                    {/* CHEVRON */}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {

                                                            e.stopPropagation();

                                                            setOpenActionMenu(
                                                                openActionMenu ===
                                                                    quotation.id
                                                                    ? null
                                                                    : quotation.id
                                                            );

                                                        }}
                                                        title="Actions"
                                                        className={`relative z-50 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all ${openActionMenu ===
                                                            quotation.id
                                                            ? 'bg-gray-100 dark:bg-gray-800'
                                                            : ''
                                                            }`}
                                                    >

                                                        <FiChevronDown
                                                            size={16}
                                                            className={`transition-transform duration-200 ${openActionMenu ===
                                                                quotation.id
                                                                ? 'rotate-90'
                                                                : ''
                                                                }`}
                                                        />

                                                    </button>

                                                </div>

                                            </Table.Cell>

                                        </Table.Row>

                                    )

                                )

                            ) : (

                                <Table.EmptyState
                                    colSpan={7}
                                    message={
                                        searchQuery ||
                                            quotationFilter !==
                                            'all' ||
                                            dateRange !== 'all'
                                            ? 'No quotations match your filters'
                                            : 'No quotations found'
                                    }
                                />

                            )}

                        </Table.Body>

                    </Table>

                </div>


                {/* =================================================
            PAGINATION
        ================================================= */}

                {totalPages > 1 && (

                    <div className="p-4 border-t border-gray-100 dark:border-gray-800">

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={
                                setCurrentPage
                            }
                        />

                    </div>

                )}

            </Card>


            {/* =================================================
          DELETE MODAL
      ================================================= */}

            <Modal.Confirm
                isOpen={deleteModalOpen}
                onClose={() =>
                    setDeleteModalOpen(false)
                }
                onConfirm={confirmDelete}
                title="Delete Quotation"
                message={`Are you sure you want to delete quotation ${quotationToDelete?.quotationNumber}? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />

        </div>
    );

};


export default AllQuotations;