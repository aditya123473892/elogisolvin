import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (request, transporterDetails) => {
  try {
    console.log("Generating invoice for request:", request);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width || 210;
    const pageHeight = doc.internal.pageSize.height || 297;

    // Header section with border
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, 50);

    // Company logo placeholder (left side)
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 30, 25);
    doc.setFontSize(8);
    doc.text("LOGO", 30, 30, { align: "center" });

    // Company header section (center)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("TEAM ELOGISOL PVT. LTD.", pageWidth / 2, 20, { align: "center" });
    
    // Company details (center aligned)
    doc.setFontSize(8);
    doc.text("Regd. Office: E-6, 3rd Floor, Office No-3, Kalkaji, New Delhi 110019", pageWidth / 2, 25, { align: "center" });
    doc.text("Admin Office: Phone No: +91-11-49061530, Mobile: +91-9810296622", pageWidth / 2, 29, { align: "center" });
    doc.text("E-mail: amit.singh@elogisol.in", pageWidth / 2, 33, { align: "center" });
    doc.text("Website: www.elogisol.com", pageWidth / 2, 37, { align: "center" });

    // State code and GSTIN info
    doc.text("State Code: 07 GSTIN: 07AABCE3576G1Z1", pageWidth / 2, 41, { align: "center" });
    doc.text("PAN: AABCE3576G", pageWidth / 2, 45, { align: "center" });
    doc.text("CIN: U63090DL2004PTC123819", pageWidth / 2, 49, { align: "center" });
    doc.text("http://www.jsb.in", pageWidth / 2, 53, { align: "center" });

    // QR Code placeholder (right side)
    doc.rect(pageWidth - 45, 15, 30, 30);
    doc.setFontSize(6);
    doc.text("QR CODE", pageWidth - 30, 32, { align: "center" });

    // TAX INVOICE header with border
    doc.setLineWidth(0.5);
    doc.rect(10, 65, pageWidth - 20, 12);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("TAX INVOICE", pageWidth / 2, 73, { align: "center" });

    // Invoice details section (without boxes)
    doc.setFontSize(9);
    doc.text("To,", 15, 88);
    doc.setFontSize(10);
    doc.text((request.customer_name?.toUpperCase() || "CUSTOMER NAME"), 15, 95);
    doc.setFontSize(8);
    
    // Wrap long text for addresses
    const pickupText = request.pickup_location || "Customer Address";
    const deliveryText = request.delivery_location || "Customer City";
    
    if (pickupText.length > 40) {
      const splitPickup = doc.splitTextToSize(pickupText, 85);
      doc.text(splitPickup, 15, 100);
    } else {
      doc.text(pickupText, 15, 100);
    }
    
    if (deliveryText.length > 40) {
      const splitDelivery = doc.splitTextToSize(deliveryText, 85);
      doc.text(splitDelivery, 15, 105);
    } else {
      doc.text(deliveryText, 15, 105);
    }
    
    doc.text("State Code: 07", 15, 110);
    doc.text("GSTIN: " + (request.gstin || "07AABCE1665A1Z1"), 15, 115);
    doc.text("A/C: " + (request.customer_name?.toUpperCase() || "CUSTOMER NAME"), 15, 120);
    doc.text("BL No: HLCUSOL2503ARXJ1", 15, 125);

    // Right section - Invoice details (without box)
    doc.setFontSize(8);
    
    // Invoice number
    doc.text("Invoice", pageWidth - 80, 88);
    doc.text(`ECAB/${request.id}/00${request.id}`, pageWidth - 35, 88);
    
    // Date
    doc.text("Dated", pageWidth - 80, 95);
    doc.text(new Date().toLocaleDateString('en-GB'), pageWidth - 35, 95);
    
    // Place of Supply
    doc.text("Place of Supply", pageWidth - 80, 102);
    doc.text("07", pageWidth - 35, 102);
    
    // Size/Type
    doc.text("Size/Type", pageWidth - 80, 109);
    doc.text(request.vehicle_type || "40/RF", pageWidth - 35, 109);
    
    // Line
    doc.text("Line", pageWidth - 80, 116);
    doc.text(transporterDetails?.line || "HAPAG LLOYD", pageWidth - 35, 116);
    
    // POL
    doc.text("POL", pageWidth - 80, 123);
    doc.text("JNPT", pageWidth - 35, 123);
    
    // POD
    doc.text("POD", pageWidth - 80, 130);
    doc.text("LUANDA", pageWidth - 35, 130);

    // Empty Pickup and Factory Location
    doc.setFontSize(8);
    doc.text("Empty Pickup: JNPT", 15, 140);
    doc.text("Factory Location: VASHI", 100, 140);
    doc.text("Handover ICD: JNPT", pageWidth - 50, 140);

    // Movement Details header
    doc.setLineWidth(1);
    doc.rect(10, 150, pageWidth - 20, 12);
    doc.setFontSize(11);
    doc.text("MOVEMENT DETAILS", pageWidth / 2, 158, { align: "center" });

    // Summary of Charges header
    doc.rect(10, 170, pageWidth - 20, 12);
    doc.setFontSize(11);
    doc.text("SUMMARY OF CHARGES", pageWidth / 2, 178, { align: "center" });

    // Charges table with optimized columns
    const serviceTotal = parseFloat(request.requested_price) || 4500;
    const transportTotal = transporterDetails ? (parseFloat(transporterDetails.total_charge) || 0) : 0;
    const baseAmount = serviceTotal + transportTotal;
    
    // Calculate GST (9% CGST + 9% SGST = 18% total)
    const cgstRate = 9;
    const sgstRate = 9;
    const cgstAmount = (baseAmount * cgstRate / 100);
    const sgstAmount = (baseAmount * sgstRate / 100);
    const totalGst = cgstAmount + sgstAmount;
    const grandTotal = baseAmount + totalGst;

    // Simplified table structure to fit better
    const chargesData = [
      [
        "Sr",
        "Service",
        "HSN Code",
        "Qty",
        "Rate",
        "Amount",
        "CGST\n9%",
        "SGST\n9%",
        "Total\nAmount"
      ],
      [
        "1",
        "Surrender\nCharges",
        "996799",
        "1",
        baseAmount.toFixed(0),
        baseAmount.toFixed(0),
        cgstAmount.toFixed(0),
        sgstAmount.toFixed(0),
        grandTotal.toFixed(0)
      ]
    ];

    autoTable(doc, {
      startY: 185,
      head: [chargesData[0]],
      body: [chargesData[1]],
      theme: "grid",
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        valign: 'middle'
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        halign: 'center',
        valign: 'middle',
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 15 },  // Sr
        1: { cellWidth: 25 },  // Service
        2: { cellWidth: 20 },  // HSN Code
        3: { cellWidth: 15 },  // Qty
        4: { cellWidth: 20 },  // Rate
        5: { cellWidth: 20 },  // Amount
        6: { cellWidth: 20 },  // CGST
        7: { cellWidth: 20 },  // SGST
        8: { cellWidth: 25 }   // Total Amount
      },
      tableWidth: 'auto',
      margin: { left: 10, right: 10 }
    });

    // Total charges row
    const totalY = doc.lastAutoTable.finalY;
    autoTable(doc, {
      startY: totalY,
      body: [
        [
          "",
          "Total Charges",
          "",
          "",
          baseAmount.toFixed(0),
          baseAmount.toFixed(0),
          cgstAmount.toFixed(0),
          sgstAmount.toFixed(0),
          grandTotal.toFixed(0)
        ]
      ],
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 2,
        halign: 'center',
        valign: 'middle',
        fontStyle: 'bold'
      },
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
      tableWidth: 'auto',
      margin: { left: 10, right: 10 }
    });

    // Amount in words
    const amountY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    const amountInWords = "Rupees " + numberToWords(grandTotal.toFixed(0)) + " Only";
    const wrappedAmountText = doc.splitTextToSize(amountInWords, pageWidth - 30);
    doc.text("Amounts in Words: " + wrappedAmountText[0], 15, amountY);
    if (wrappedAmountText.length > 1) {
      doc.text(wrappedAmountText[1], 15, amountY + 5);
    }

    // Invoice note
    doc.setFontSize(9);
    doc.text("Invoice Note:", 15, amountY + 15);
    doc.text(`SEGU${Math.floor(Math.random() * 1000000)}99 MH/2448/2024-25`, 15, amountY + 20);

    // Terms and conditions
    doc.setFontSize(10);
    doc.text("Terms & Conditions", 15, amountY + 30);
    doc.setFontSize(8);
    const terms = [
      "1. Consignor/Consignee will be responsible for paying GST applicable from 1-July-2017.",
      "2. Cheques/DD should be drawn in favour of JSB CARGO MOVERS PRIVATE LIMITED payable at New Delhi.",
      "3. Any discrepancies in the bill should be brought to the notice of the company within 2 week of bill date.",
      "4. GST on \"Road Transportation\" to be paid by Service Recipient under reverse charge i.e. @ 5%.",
      "5. Interest @ 18% p.a. is applicable if invoice is not paid in 30 Days"
    ];

    let currentY = amountY + 35;
    terms.forEach((term, i) => {
      const wrappedTerm = doc.splitTextToSize(term, pageWidth - 30);
      doc.text(wrappedTerm, 15, currentY);
      currentY += wrappedTerm.length * 4;
    });

    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    // IRN section
    doc.setFontSize(8);
    doc.text("IRN No:", 15, currentY);
    doc.text("N119856ds242ef80d1854nea4395270d9a8375ec2", 15, currentY + 5);

    // RTGS details
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
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 70 }
      },
      margin: { left: 15 }
    });

    // Company name and authorized signatory (right aligned)
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

// Helper function to parse service type
function parseServiceType(serviceType) {
  if (!serviceType) return [];
  try {
    return typeof serviceType === "string" ? JSON.parse(serviceType) : serviceType;
  } catch (e) {
    console.error("Error parsing service type:", e);
    return [serviceType];
  }
}

// Helper function to parse service prices
function parseServicePrices(servicePrices) {
  if (!servicePrices) return {};
  try {
    return typeof servicePrices === "string" ? JSON.parse(servicePrices) : servicePrices;
  } catch (e) {
    console.error("Error parsing service prices:", e);
    return {};
  }
}

// Helper function to convert number to words
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