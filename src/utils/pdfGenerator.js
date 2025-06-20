import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (request, transporterDetails) => {
  try {
    console.log("Generating invoice for request:", request, "with transporter details:", transporterDetails);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width || 210;
    const pageHeight = doc.internal.pageSize.height || 297;

    // Header section with border
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, 50);

    // Company logo placeholder
    doc.rect(15, 15, 30, 25);
    doc.setFontSize(8);
    doc.text("LOGO", 30, 30, { align: "center" });

    // Company header
    doc.setFontSize(12);
    doc.text("TEAM ELOGISOL PVT. LTD.", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(8);
    doc.text("Regd. Office: E-6, 3rd Floor, Office No-3, Kalkaji, New Delhi 110019", pageWidth / 2, 25, { align: "center" });
    doc.text("Admin Office: Phone No: +91-11-49061530, Mobile: +91-9810296622", pageWidth / 2, 29, { align: "center" });
    doc.text("E-mail: amit.singh@elogisol.in", pageWidth / 2, 33, { align: "center" });
    doc.text("Website: www.elogisol.com", pageWidth / 2, 37, { align: "center" });
    doc.text("State Code: 07 GSTIN: 07AABCE3576G1Z1", pageWidth / 2, 41, { align: "center" });
    doc.text("PAN: AABCE3576G", pageWidth / 2, 45, { align: "center" });
    doc.text("CIN: U63090DL2004PTC123819", pageWidth / 2, 49, { align: "center" });
    doc.text("http://www.jsb.in", pageWidth / 2, 53, { align: "center" });

    // QR Code placeholder
    doc.rect(pageWidth - 45, 15, 30, 30);
    doc.setFontSize(6);
    doc.text("QR CODE", pageWidth - 30, 32, { align: "center" });

    // TAX INVOICE header
    doc.setLineWidth(0.5);
    doc.rect(10, 65, pageWidth - 20, 12);
    doc.setFontSize(14);
    doc.text("TAX INVOICE", pageWidth / 2, 73, { align: "center" });

    // Invoice details section
    doc.setFontSize(9);
    doc.text("To,", 15, 88);
    doc.setFontSize(10);
    doc.text((request.customer_name?.toUpperCase() || "CUSTOMER NAME"), 15, 95);
    doc.setFontSize(8);
    
    const pickupText = request.pickup_location || "Customer Address";
    const deliveryText = request.delivery_location || "Customer City";
    
    doc.text(doc.splitTextToSize(pickupText, 85), 15, 100);
    doc.text(doc.splitTextToSize(deliveryText, 85), 15, 110);
    doc.text("State Code: 07", 15, 120);
    doc.text("GSTIN: " + (request.gstin || "07AABCE1665A1Z1"), 15, 125);
    doc.text("A/C: " + (request.customer_name?.toUpperCase() || "CUSTOMER NAME"), 15, 130);
    doc.text("BL No: HLCUSOL2503ARXJ1", 15, 135);

    // Right section - Invoice details
    doc.setFontSize(8);
    doc.text("Invoice", pageWidth - 80, 88);
    doc.text(`ECAB/${request.id}/00${request.id}`, pageWidth - 35, 88);
    doc.text("Dated", pageWidth - 80, 95);
    doc.text(new Date().toLocaleDateString('en-GB'), pageWidth - 35, 95);
    doc.text("Place of Supply", pageWidth - 80, 102);
    doc.text("07", pageWidth - 35, 102);
    doc.text("Size/Type", pageWidth - 80, 109);
    doc.text(request.vehicle_type || "40/RF", pageWidth - 35, 109);
    doc.text("Line", pageWidth - 80, 116);
    doc.text(transporterDetails[0]?.line || "HAPAG LLOYD", pageWidth - 35, 116);
    doc.text("POL", pageWidth - 80, 123);
    doc.text("JNPT", pageWidth - 35, 123);
    doc.text("POD", pageWidth - 80, 130);
    doc.text("LUANDA", pageWidth - 35, 130);

    // Location details
    doc.setFontSize(8);
    doc.text("Empty Pickup: JNPT", 15, 145);
    doc.text("Factory Location: VASHI", 100, 145);
    doc.text("Handover ICD: JNPT", pageWidth - 50, 145);

    // Vehicle and Container Details header
    doc.setLineWidth(1);
    doc.rect(10, 155, pageWidth - 20, 12);
    doc.setFontSize(11);
    doc.text("VEHICLE & CONTAINER DETAILS", pageWidth / 2, 163, { align: "center" });

    // Vehicle and Container table
    const vehicleData = transporterDetails.map((trans, index) => [
      index + 1,
      trans.vehicle_number,
      trans.driver_name,
      trans.container_no,
      trans.container_size,
      trans.container_type,
      trans.seal_no,
      trans.total_charge
    ]);

    autoTable(doc, {
      startY: 170,
      head: [['Sr', 'Vehicle No', 'Driver', 'Container No', 'Size', 'Type', 'Seal No', 'Amount']],
      body: vehicleData,
      theme: "grid",
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2, halign: 'center', overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 25 }
      },
      margin: { left: 10, right: 10 }
    });

    // Summary of Charges header
    const chargesY = doc.lastAutoTable.finalY + 10;
    doc.rect(10, chargesY, pageWidth - 20, 12);
    doc.setFontSize(11);
  

    // Calculate totals
    const serviceTotal = parseFloat(request.requested_price) || 0;
    const transportTotal = transporterDetails.reduce((sum, trans) => sum + (parseFloat(trans.total_charge) || 0), 0);
    const baseAmount = serviceTotal + transportTotal;
    const cgstAmount = (baseAmount * 9 / 100);
    const sgstAmount = (baseAmount * 9 / 100);
    const totalGst = cgstAmount + sgstAmount;
    const grandTotal = baseAmount + totalGst;

    // Charges table
    const chargesData = [
      ["Sr", "Service", "HSN Code", "Qty", "Rate", "Amount", "CGST\n9%", "SGST\n9%", "Total\nAmount"],
      ["1", "Transportation\nCharges", "9965", request.no_of_vehicles, (baseAmount / request.no_of_vehicles).toFixed(0), baseAmount.toFixed(0), cgstAmount.toFixed(0), sgstAmount.toFixed(0), grandTotal.toFixed(0)]
    ];

    autoTable(doc, {
      startY: chargesY + 15,
      head: [chargesData[0]],
      body: [chargesData[1]],
      theme: "grid",
      headStyles: { fillColor: [240, 240,240], textColor: [0, 0,0], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      styles: { fontSize: 7, cellPadding: 2, halign: 'center', overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 25 }
      },
      margin: { left: 10, right: 10 }
    });

    // Total charges row
    const totalY = doc.lastAutoTable.finalY;
    autoTable(doc, {
      startY: totalY,
      body: [["", "Total Charges", "", "", "", baseAmount.toFixed(0), cgstAmount.toFixed(0), sgstAmount.toFixed(0), grandTotal.toFixed(0)]],
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2, halign: 'center', fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 25 }
      },
      margin: { left: 10, right: 10 }
    });

    // Amount in words
    const amountY = totalY + 10;
    doc.setFontSize(9);
    const amountInWords = "Rupees " + numberToWords(grandTotal.toFixed(0)) + " Only";
    const wrappedAmountText = doc.splitTextToSize(amountInWords, pageWidth - 30);
    doc.text("Amounts in Words: " + wrappedAmountText[0], 15, amountY);
    if (wrappedAmountText.length > 1) {
      doc.text(wrappedAmountText[1], 15, amountY + 5);
    }

    // Invoice note
    doc.text("Invoice Note:", 15, amountY + 15);
    doc.text(`SEGU${Math.floor(Math.random() * 1000000)}99 MH/2448/2024-25`, 15, amountY + 20);

    // Terms and conditions
    doc.setFontSize(10);
    doc.text("Terms & Conditions", 15, amountY + 30);
    doc.setFontSize(8);
    const terms = [
      "1. Consignor/Consignee will be responsible for paying GST applicable from 1-July-2017.",
      "2. Cheques/DD should be drawn in favour of ELOGISOL PRIVATE LIMITED payable at New Delhi.",
      "3. Any discrepancies in the bill should be brought to the notice of the company within 2 week of bill date.",
      "4. GST on \"Road Transportation\" to be paid by Service Recipient under reverse charge i.e. @ 5%.",
      "5. Interest @ 18% p.a. is applicable if invoice is not paid in 30 Days"
    ];

    let currentY = amountY + 35;
    terms.forEach((term) => {
      const wrappedTerm = doc.splitTextToSize(term, pageWidth - 30);
      doc.text(wrappedTerm, 15, currentY);
      currentY += wrappedTerm.length * 4;
    });

    // Check for new page
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    // IRN and RTGS
    doc.setFontSize(8);
    doc.text("IRN No:", 15, currentY);
    doc.text("N119856ds242ef80d1854nea4395270d9a8375ec2", 15, currentY + 5);
    doc.setFontSize(10);
    doc.text("RTGS Details", 15, currentY + 15);
    doc.setFontSize(9);
    doc.text("TEAM ELOGISOL PVT. LIMITED", 15, currentY + 20);

    // Payment details table
    const paymentData = [
      ["Payment Details", "For INR Payment"],
      ["IFSC Code", "YESB0000048"],
      ["Swift Code", "YESBINBB"],
      ["Bank Name", "Yes Bank Ltd"],
      ["Account No", "004890100015XXX"]
    ];

    autoTable(doc, {
      startY: currentY + 25,
      body: paymentData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 70 } },
      margin: { left: 15 }
    });

    // Company name and signatory
    const sigY = currentY + 25;
    doc.setFontSize(9);
    doc.text("TEAM ELOGISOL PVT. LIMITED", pageWidth - 60, sigY);
    doc.text("Authorized Signatory", pageWidth - 60, sigY + 35);

    return doc;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};

// Helper functions remain unchanged
function parseServiceType(serviceType) {
  if (!serviceType) return [];
  try {
    return typeof serviceType === "string" ? JSON.parse(serviceType) : serviceType;
  } catch (e) {
    console.error("Error parsing service type:", e);
    return [serviceType];
  }
}

function parseServicePrices(servicePrices) {
  if (!servicePrices) return {};
  try {
    return typeof servicePrices === "string" ? JSON.parse(servicePrices) : servicePrices;
  } catch (e) {
    console.error("Error parsing service prices:", e);
    return {};
  }
}

function numberToWords(num) {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const numStr = num.toString();
  const parts = numStr.split('.');
  const wholePart = parseInt(parts[0]);
  const decimalPart = parts.length > 1 ? parseInt(parts[1]) : 0;
  
  function convertLessThanOneThousand(n) {
    if (n === 0) return '';
    if (n < 20) return units[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
  }
  
  let result = '';
  
  if (wholePart === 0) {
    result = 'Zero';
  } else {
    const crores = Math.floor(wholePart / 10000000);
    const lakhs = Math.floor((wholePart % 10000000) / 100000);
    const thousands = Math.floor((wholePart % 100000) / 1000);
    const remainder = wholePart % 1000;
    
    if (crores > 0) {
      result += convertLessThanOneThousand(crores) + ' Crore ';
    }
    
    if (lakhs > 0) {
      result += convertLessThanOneThousand(lakhs) + ' Lakh ';
    }
    
    if (thousands > 0) {
      result += convertLessThanOneThousand(thousands) + ' Thousand ';
    }
    
    if (remainder > 0) {
      result += convertLessThanOneThousand(remainder);
    }
  }
  
  if (decimalPart > 0) {
    result += ' Point ' + convertLessThanOneThousand(decimalPart);
  }
  
  return result.trim();
}