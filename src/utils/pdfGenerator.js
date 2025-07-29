import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../images/elogilogo.png"; // Adjust the path as necessary

export const generateInvoice = (request, transporterDetails) => {
  try {
    console.log(
      "Generating invoice for request:",
      request,
      "with transporter details:",
      transporterDetails
    );

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width || 210;
    const pageHeight = doc.internal.pageSize.height || 297;

    // Header section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TEAM ELOGISOL PVT. LTD.", pageWidth / 2, 20, { align: "center" });
    doc.setLineWidth(0.3);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Regd. Office: E-6, 3rd Floor, Office No-3, Kalkaji, New Delhi 110019",
      pageWidth / 2,
      28,
      { align: "center" }
    );
    doc.text(
      "Admin Office: Phone No: +91-11-49061530, Mobile: +91-9810296622",
      pageWidth / 2,
      33,
      { align: "center" }
    );
    doc.text("E-mail: amit.singh@elogisol.in", pageWidth / 2, 38, {
      align: "center",
    });
    doc.text("Website: www.elogisol.com", pageWidth / 2, 43, {
      align: "center",
    });
    doc.text("State Code: 07 GSTIN: 07AABCE3576G1Z1", pageWidth / 2, 48, {
      align: "center",
    });
    doc.text("PAN: AABCE3576G", pageWidth / 2, 53, { align: "center" });
    doc.text("CIN: U63090DL2004PTC123819", pageWidth / 2, 58, {
      align: "center",
    });

    // Add company logo
    try {
      doc.addImage(logo, "PNG", 15, 15, 30, 20); // Add logo at (15, 15, 30, 25)
    } catch (error) {
      console.error("Error adding logo to PDF:", error);
      // Fallback to placeholder if logo fails
      doc.setDrawColor(150, 150, 150);
      doc.rect(15, 15, 30, 25);
      doc.setFontSize(8);
      doc.text("LOGO", 30, 30, { align: "center" });
    }

    // TAX INVOICE header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", pageWidth / 2, 70, { align: "center" });
    doc.line(90, 72, pageWidth - 90, 72); // Underline for TAX INVOICE

    // Invoice details section
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("To:", 15, 85);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(request.customer_name?.toUpperCase() || "CUSTOMER NAME", 15, 92);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const pickupText = request.pickup_location || "Customer Address";
    const deliveryText = request.delivery_location || "Customer City";

    doc.text(doc.splitTextToSize(pickupText, 85), 15, 97);
    doc.text(doc.splitTextToSize(deliveryText, 85), 15, 107);
    doc.text("State Code: 07", 15, 117);
    doc.text("GSTIN: " + (request.gstin || "07AABCE1665A1Z1"), 15, 122);
    doc.text(
      "A/C: " + (request.customer_name?.toUpperCase() || "CUSTOMER NAME"),
      15,
      127
    );
    doc.text("BL No: " + (transporterDetails[0]?.bl_no || "N/A"), 15, 132);

    // Right section - Invoice details
    doc.setFontSize(8);
    doc.text("Invoice:", pageWidth - 80, 85);
    doc.text(`ECAB/${request.id}/00${request.id}`, pageWidth - 35, 85);
    doc.text("Dated:", pageWidth - 80, 92);
    doc.text(new Date(request.created_at).toLocaleDateString("en-GB"), pageWidth - 35, 92);
    doc.text("Place of Supply:", pageWidth - 80, 99);
    doc.text("07", pageWidth - 35, 99);
    doc.text("Size/Type:", pageWidth - 80, 106);
    doc.text(request.vehicle_type || "N/A", pageWidth - 35, 106);
    doc.text("Line:", pageWidth - 80, 113);
    doc.text(transporterDetails[0]?.line || "N/A", pageWidth - 35, 113);
    doc.text("POL:", pageWidth - 80, 120);
    doc.text(request.pickup_location ? request.pickup_location.split(',')[0] : "N/A", pageWidth - 35, 120);
    doc.text("POD:", pageWidth - 80, 127);
    doc.text(request.delivery_location ? request.delivery_location.split(',')[0] : "N/A", pageWidth - 35, 127);

    // Location details - from API data
    doc.text(`Empty Pickup: ${request.pickup_location ? request.pickup_location.split(',')[0] : "N/A"}`, 15, 142);
    doc.text(`Factory Location: ${request.stuffing_location || request.pickup_location || "N/A"}`, 100, 142);
    doc.text(`Handover ICD: ${request.delivery_location ? request.delivery_location.split(',')[0] : "N/A"}`, pageWidth - 50, 142);

    // Summary of Charges header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY OF CHARGES", pageWidth / 2, 155, { align: "center" });
    doc.line(80, 157, pageWidth - 80, 157);

    // Calculate totals - FIXED: Use only requested_price as base amount
    const baseAmount = parseFloat(request.requested_price) || 0;
    const cgstAmount = (baseAmount * 9) / 100;
    const sgstAmount = (baseAmount * 9) / 100;
    const igstAmount = (baseAmount * 18) / 100;
    const totalGst = cgstAmount + sgstAmount + igstAmount;
    const grandTotal = baseAmount + totalGst;

    // Charges table with IGST column
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
        "IGST\n18%",
        "Total\nAmount",
      ],
      [
        "1",
        "Transportation\nCharges",
        "9965",
        request.no_of_vehicles || 1,
        (baseAmount / (request.no_of_vehicles || 1)).toFixed(0),
        baseAmount.toFixed(0),
        cgstAmount.toFixed(0),
        sgstAmount.toFixed(0),
        igstAmount.toFixed(0),
        grandTotal.toFixed(0),
      ],
    ];

    autoTable(doc, {
      startY: 165,
      head: [chargesData[0]],
      body: [chargesData[1]],
      theme: "grid",
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      styles: {
        fontSize: 7,
        cellPadding: 3,
        halign: "center",
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 22 },
        2: { cellWidth: 18 },
        3: { cellWidth: 12 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 },
        7: { cellWidth: 18 },
        8: { cellWidth: 18 },
        9: { cellWidth: 22 },
      },
      margin: { left: 10, right: 10 },
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
          "",
          baseAmount.toFixed(0),
          cgstAmount.toFixed(0),
          sgstAmount.toFixed(0),
          igstAmount.toFixed(0),
          grandTotal.toFixed(0),
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 3,
        halign: "center",
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 22 },
        2: { cellWidth: 18 },
        3: { cellWidth: 12 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 },
        7: { cellWidth: 18 },
        8: { cellWidth: 18 },
        9: { cellWidth: 22 },
      },
      margin: { left: 10, right: 10 },
    });

    // Vehicle and Container Details header
    const vehicleY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("VEHICLE & CONTAINER DETAILS", pageWidth / 2, vehicleY, {
      align: "center",
    });
    doc.line(70, vehicleY + 2, pageWidth - 70, vehicleY + 2);

    // Vehicle and Container table - removed amount column
    const vehicleData = transporterDetails.map((trans, index) => [
      index + 1,
      trans.vehicle_number || "N/A",
      trans.driver_name || "N/A",
      trans.container_no || "N/A",
      trans.container_size || "N/A",
      trans.container_type || "N/A",
      trans.seal_no || "N/A",
    ]);

    autoTable(doc, {
      startY: vehicleY + 10,
      head: [
        [
          "Sr",
          "Vehicle No",
          "Driver",
          "Container No",
          "Size",
          "Type",
          "Seal No",
        ],
      ],
      body: vehicleData,
      theme: "grid",
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
      },
      styles: {
        fontSize: 7,
        cellPadding: 3,
        halign: "center",
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
      },
      margin: { left: 10, right: 10 },
    });

    // Helper function to check if we need a new page
    const checkNewPage = (currentY, requiredSpace = 20) => {
      if (currentY + requiredSpace > pageHeight - 20) {
        doc.addPage();
        return 20; // Reset to top margin
      }
      return currentY;
    };

    // Amount in words
    let currentY = doc.lastAutoTable.finalY + 10;
    currentY = checkNewPage(currentY, 30);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const amountInWords =
      "Rupees " + numberToWords(grandTotal.toFixed(0)) + " Only";
    const wrappedAmountText = doc.splitTextToSize(
      amountInWords,
      pageWidth - 30
    );

    doc.text("Amount in Words: " + wrappedAmountText[0], 15, currentY);
    currentY += 5;

    // Handle additional lines for amount in words
    for (let i = 1; i < wrappedAmountText.length; i++) {
      currentY = checkNewPage(currentY, 5);
      doc.text(wrappedAmountText[i], 15, currentY);
      currentY += 5;
    }

    // Invoice note
    currentY += 5;
    currentY = checkNewPage(currentY, 15);
    doc.text("Invoice Note:", 15, currentY);
    currentY += 5;
    doc.text(
      `SEGU${Math.floor(Math.random() * 1000000)}99 MH/2448/2024-25`,
      15,
      currentY
    );
    currentY += 10;

    // Terms and conditions
    currentY = checkNewPage(currentY, 50); // Reserve space for terms section

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", 15, currentY);
    doc.line(15, currentY + 2, 75, currentY + 2); // Underline for terms
    currentY += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const terms = [
      "1. Consignor/Consignee will be responsible for paying GST applicable from 1-July-2017.",
      "2. Cheques/DD should be drawn in favour of ELOGISOL PRIVATE LIMITED payable at New Delhi.",
      "3. Any discrepancies in the bill should be brought to the notice of the company within 2 weeks of bill date.",
      "4. GST on 'Road Transportation' to be paid by Service Recipient under reverse charge i.e. @ 5%.",
      "5. Interest @ 18% p.a. is applicable if invoice is not paid in 30 Days",
    ];

    terms.forEach((term, index) => {
      const wrappedTerm = doc.splitTextToSize(term, pageWidth - 30);
      const requiredSpace = wrappedTerm.length * 4 + 2; // Space needed for this term

      currentY = checkNewPage(currentY, requiredSpace);

      wrappedTerm.forEach((line, lineIndex) => {
        doc.text(line, 15, currentY);
        currentY += 4; // Consistent line spacing
      });
      currentY += 2; // Small gap between terms
    });

    // IRN section
    currentY += 5;
    currentY = checkNewPage(currentY, 40);

    doc.setFontSize(8);
    doc.text("IRN No:", 15, currentY);
    currentY += 5;
    doc.text("N119856ds242ef80d1854nea4395270d9a8375ec2", 15, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RTGS Details", 15, currentY);
    doc.line(15, currentY + 2, 60, currentY + 2); // Underline for RTGS
    currentY += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("TEAM ELOGISOL PVT. LIMITED", 15, currentY);
    currentY += 10;

    // Payment details table
    currentY = checkNewPage(currentY, 60);

    const paymentData = [
      ["Payment Details", "For INR Payment"],
      ["IFSC Code", "YESB0000048"],
      ["Swift Code", "YESBINBB"],
      ["Bank Name", "Yes Bank Ltd"],
      ["Account No", "004890100015XXX"],
    ];

    autoTable(doc, {
      startY: currentY,
      body: paymentData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 70 } },
      margin: { left: 15 },
    });

    // Company name and signatory
    const sigY = doc.lastAutoTable.finalY + 10;
    const finalSigY = checkNewPage(sigY, 40);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TEAM ELOGISOL PVT. LIMITED", pageWidth - 60, finalSigY);
    doc.text("Authorized Signatory", pageWidth - 60, finalSigY + 35);

    return doc;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};

// Helper functions
function parseServiceType(serviceType) {
  if (!serviceType) return [];
  try {
    return typeof serviceType === "string"
      ? JSON.parse(serviceType)
      : serviceType;
  } catch (e) {
    console.error("Error parsing service type:", e);
    return [serviceType];
  }
}

function parseServicePrices(servicePrices) {
  if (!servicePrices) return {};
  try {
    return typeof servicePrices === "string"
      ? JSON.parse(servicePrices)
      : servicePrices;
  } catch (e) {
    console.error("Error parsing service prices:", e);
    return {};
  }
}

function numberToWords(num) {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const numStr = num.toString();
  const parts = numStr.split(".");
  const wholePart = parseInt(parts[0]);
  const decimalPart = parts.length > 1 ? parseInt(parts[1]) : 0;

  function convertLessThanOneThousand(n) {
    if (n === 0) return "";
    if (n < 20) return units[n];
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "")
      );
    return (
      units[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 !== 0 ? " " + convertLessThanOneThousand(n % 100) : "")
    );
  }

  let result = "";

  if (wholePart === 0) {
    result = "Zero";
  } else {
    const crores = Math.floor(wholePart / 10000000);
    const lakhs = Math.floor((wholePart % 10000000) / 100000);
    const thousands = Math.floor((wholePart % 100000) / 1000);
    const remainder = wholePart % 1000;

    if (crores > 0) {
      result += convertLessThanOneThousand(crores) + " Crore ";
    }

    if (lakhs > 0) {
      result += convertLessThanOneThousand(lakhs) + " Lakh ";
    }

    if (thousands > 0) {
      result += convertLessThanOneThousand(thousands) + " Thousand ";
    }

    if (remainder > 0) {
      result += convertLessThanOneThousand(remainder);
    }
  }

  if (decimalPart > 0) {
    result += " Point " + convertLessThanOneThousand(decimalPart);
  }

  return result.trim();
}