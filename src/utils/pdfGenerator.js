import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (request, transporterDetails) => {
  try {
    console.log("Generating invoice for request:", request);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width || 210;

    // Add invoice header with styling
    doc.setFontSize(24);
    doc.setTextColor(41, 128, 185);
    doc.text("TRANSPORT INVOICE", pageWidth / 2, 20, { align: "center" });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Add invoice details
    doc.setFontSize(12);
    doc.text(`Invoice #: INV-${request.id}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 60, 40);

    // Add horizontal line
    doc.setLineWidth(0.5);
    doc.line(20, 45, pageWidth - 20, 45);

    // Customer details section
    doc.setFontSize(14);
    doc.text("Bill To:", 20, 60);
    doc.setFontSize(11);
    doc.text(
      [request.customer_name || "N/A", request.customer_email || "N/A"],
      20,
      70
    );

    // Service details table
    autoTable(doc, {
      startY: 90,
      head: [["Description", "Details"]],
      body: [
        ["Service Type", parseServiceType(request.service_type).join(", ") || "N/A"],
        ["Vehicle Type", request.vehicle_type || "N/A"],
        ["Pickup Location", request.pickup_location || "N/A"],
        ["Delivery Location", request.delivery_location || "N/A"],
        ["Weight", request.cargo_weight ? `${request.cargo_weight} kg` : "N/A"],
        ["Containers", `20ft: ${request.containers_20ft || 0}, 40ft: ${request.containers_40ft || 0}`],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 12,
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { fontStyle: "bold" },
      },
    });

    // Get the final Y position after the table
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 200;

    // Add service prices breakdown
    const servicePrices = parseServicePrices(request.service_prices);
    const servicePricesRows = Object.entries(servicePrices).map(([service, price]) => [
      service,
      `₹${price}`,
    ]);

    autoTable(doc, {
      startY: finalY,
      head: [["Service", "Amount"]],
      body: servicePricesRows,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
    });

    // Get position after service prices table
    const afterServiceY = doc.lastAutoTable.finalY + 10;

    // Add transporter charges if available
    if (transporterDetails) {
      autoTable(doc, {
        startY: afterServiceY,
        head: [["Transport Charges", "Amount"]],
        body: [
          ["Base Charge", `₹${transporterDetails.base_charge || 0}`],
          ["Additional Charges", `₹${transporterDetails.additional_charges || 0}`],
          ["Total Transport Charge", `₹${transporterDetails.total_charge || 0}`],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
      });
    }

    // Calculate total amount
    const serviceTotal = parseFloat(request.requested_price) || 0;
    const transportTotal = transporterDetails ? (parseFloat(transporterDetails.total_charge) || 0) : 0;
    const grandTotal = serviceTotal + transportTotal;

    // Add grand total
    const totalY = doc.lastAutoTable.finalY + 10;
    doc.setDrawColor(41, 128, 185);
    doc.setFillColor(245, 245, 245);
    doc.rect(pageWidth - 80, totalY - 10, 60, 40, "FD");
    doc.setFontSize(12);
    doc.text("Service Amount:", pageWidth - 75, totalY);
    doc.text(`₹${serviceTotal}`, pageWidth - 35, totalY, { align: "right" });
    doc.text("Transport Amount:", pageWidth - 75, totalY + 10);
    doc.text(`₹${transportTotal}`, pageWidth - 35, totalY + 10, { align: "right" });
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text("Grand Total:", pageWidth - 75, totalY + 25);
    doc.text(`₹${grandTotal}`, pageWidth - 35, totalY + 25, { align: "right" });

    // Add footer
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(10);
    const footerText = [
      "Thank you for choosing our services!",
      "ElogiSol Transport Services",
      "Contact: support@elogisol.com",
    ];
    doc.text(footerText, pageWidth / 2, totalY + 50, { align: "center" });

    return doc;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};

// Helper function to safely parse service type
const parseServiceType = (serviceType) => {
  if (!serviceType) return [];
  try {
    return typeof serviceType === "string"
      ? JSON.parse(serviceType)
      : Array.isArray(serviceType)
      ? serviceType
      : [];
  } catch (e) {
    console.error("Service type parsing error:", e);
    return [];
  }
};

// Helper function to safely parse service prices
const parseServicePrices = (servicePrices) => {
  if (!servicePrices) return {};
  try {
    return typeof servicePrices === "string"
      ? JSON.parse(servicePrices)
      : servicePrices;
  } catch (e) {
    console.error("Service prices parsing error:", e);
    return {};
  }
};
