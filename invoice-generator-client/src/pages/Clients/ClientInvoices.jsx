import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

import { FiArrowLeft, FiFileText } from "react-icons/fi";


const ClientInvoices = () => {


    const { id } = useParams();

    const location = useLocation();

    const navigate = useNavigate();


    const client = location.state?.client;



    // temporary mock invoices

    const invoices = [

        // Acme Corp (client id: 1)

        {
            id: "INV-001",
            clientId: 1,
            amount: 1200,
            status: "paid",
            date: "2024-01-15"
        },

        {
            id: "INV-002",
            clientId: 1,
            amount: 2500,
            status: "pending",
            date: "2024-01-20"
        },


        // TechStart Inc (client id: 2)

        {
            id: "INV-003",
            clientId: 2,
            amount: 900,
            status: "paid",
            date: "2024-01-22"
        },

        {
            id: "INV-004",
            clientId: 2,
            amount: 1800,
            status: "pending",
            date: "2024-02-05"
        },


        // Global Solutions (client id: 3)

        {
            id: "INV-005",
            clientId: 3,
            amount: 5000,
            status: "paid",
            date: "2024-02-10"
        },


        // Design Studio (client id: 4)

        {
            id: "INV-006",
            clientId: 4,
            amount: 750,
            status: "paid",
            date: "2024-02-15"
        },


        // Marketing Pro (client id: 5)

        {
            id: "INV-007",
            clientId: 5,
            amount: 2200,
            status: "pending",
            date: "2024-02-18"
        },


        // WebDev Co (client id: 6)

        {
            id: "INV-008",
            clientId: 6,
            amount: 3200,
            status: "paid",
            date: "2024-02-20"
        }

    ];



    // FILTER ONLY THIS CLIENT'S INVOICES

    const clientInvoices = invoices.filter(
        invoice => invoice.clientId === Number(id)
    );

    const handleViewInvoice = (invoice) => {

    navigate(`/invoices/${invoice.id}`, {
        state: {
            invoice,
            client
        }
    });

};

    return (

        <div className="space-y-6">


            {/* HEADER */}

            <div className="flex items-center justify-between">


                <div>

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">

                        {client?.name || "Client"} Invoices

                    </h1>


                    <p className="text-gray-500 dark:text-gray-400">

                        Invoice history of this client

                    </p>


                </div>



                <Button
                    onClick={() => navigate(-1)}
                >

                    <FiArrowLeft className="mr-2"/>

                    Back

                </Button>


            </div>



            {/* CLIENT INFO */}


            <Card>


                <div className="flex items-center gap-4">


                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">


                        <FiFileText
                            size={24}
                            className="text-blue-600"
                        />


                    </div>



                    <div>


                        <h2 className="font-semibold text-lg">

                            {client?.name || "Unknown Client"}

                        </h2>


                        <p className="text-sm text-gray-500">

                            Client ID : {id}

                        </p>


                    </div>


                </div>


            </Card>





            {/* INVOICE LIST */}


            <div className="grid gap-4">


                {
                    clientInvoices.length > 0 ? (

                        clientInvoices.map((invoice)=>(


                            <Card key={invoice.id}>


                                <div className="flex justify-between items-center">


                                    <div>


                                        <h3 className="font-semibold text-primary cursor-pointer hover:underline" onClick={() => handleViewInvoice(invoice)}>

                                            {invoice.id}

                                        </h3>


                                        <p className="text-sm text-gray-500">

                                            {invoice.date}

                                        </p>


                                    </div>



                                    <div className="text-right">


                                        <p className="font-bold">

                                            ${invoice.amount}

                                        </p>



                                        <Badge

                                            variant={
                                                invoice.status === "paid"
                                                ?
                                                "success"
                                                :
                                                "warning"
                                            }

                                        >

                                            {invoice.status}

                                        </Badge>


                                    </div>


                                </div>


                            </Card>


                        ))

                    ) : (

                        <Card>

                            <p className="text-center text-gray-500">

                                No invoices found for this client.

                            </p>

                        </Card>

                    )
                }


            </div>


        </div>

    );

};


export default ClientInvoices;