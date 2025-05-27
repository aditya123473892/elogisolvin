import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateGR = (request, transporterDetails) => {
  const copies = ["Original Copy", "Duplicate Copy", "Triplicate Copy"];
  const doc = new jsPDF();

  copies.forEach((copyType, index) => {
    if (index > 0) doc.addPage();

    // Header with date and eLOGFreight info
    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString(), 14, 10);
    doc.text("ELOGISOL - GR Print", doc.internal.pageSize.width / 2, 10, {
      align: "center",
    });

    // Copy Type (top right)
    doc.setFontSize(12);
    doc.setTextColor(255, 0, 0);
    doc.text(copyType, doc.internal.pageSize.width - 50, 10);
    doc.setTextColor(0, 0, 0);

    // Company Logo placeholder (left side)
    doc.rect(14, 20, 25, 25); // Logo placeholder box
    doc.setFontSize(6);
    doc.text("TEAM ELOGISOL PVT. LTD.", 16, 35);

    // Main Company Header
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 255);
    doc.text(
      "TEAM ELOGISOL PVT. LTD.",
      doc.internal.pageSize.width / 2,
      25,
      { align: "center" }
    );

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      "Complete Logistics Solution Provider",
      doc.internal.pageSize.width / 2,
      32,
      { align: "center" }
    );

    // Company Address
    doc.setFontSize(8);
    const addressLines = [
      "Office Address: E-6, 3rd Floor, Office No-3, Kalkaji, New Delhi 110019",
      "Phone: +91-11-49061530, Mobile: +91-9810296622",
      "E-mail: amit.singh@elogisol.in, Website: www.elogisol.com",
    ];

    addressLines.forEach((line, i) => {
      doc.text(line, doc.internal.pageSize.width / 2, 38 + i * 4, {
        align: "center",
      });
    });

    // Main details table
    const tableData = [
      [
        {
          content: "Consignor",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.consigner || "aditya" },
        {
          content: "GR No",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.id || "2008" },
      ],
      [
        {
          content: "Consignee",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.consignee || "aditya" },
        {
          content: "Date",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: new Date().toLocaleDateString() },
      ],
      [
        {
          content: "Address",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.delivery_location || "kanpur" },
        {
          content: "Party GSTIN",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.gstin || "09AAACF3799A1ZN" },
      ],
      [
        {
          content: "Trailor/Truck No",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: transporterDetails?.vehicle_number || "gr12762" },
        {
          content: "Origin",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.pickup_location || "delhi" },
      ],
      [
        {
          content: "Driver Name",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: transporterDetails?.driver_name || "Vikas" },
        {
          content: "To",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.delivery_location || "kanpur" },
      ],
      [
        {
          content: "Mobile No",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: transporterDetails?.driver_contact || "7788690011" },
        {
          content: "Handover",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.delivery_location || "kanpur" },
      ],
      [
        {
          content: "Description of goods",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.cargo_type || "Perishable", styles: { colSpan: 3 } },
        "",
        "",
      ],
    ];

    doc.autoTable({
      startY: 55,
      head: [],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: "left",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 35, fillColor: [240, 240, 240] },
        1: { cellWidth: 50 },
        2: { cellWidth: 35, fillColor: [240, 240, 240] },
        3: { cellWidth: 50 },
      },
    });

    // Second section with container details
    const containerData = [
      [
        {
          content: "Jo No",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.id || "2008" },
        {
          content: "(TO BE FILLED BY PARTY)",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240], colSpan: 2 },
        },
        "",
      ],
      [
        {
          content: "Container No",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.container_number || "MNBU4429717" },
        {
          content: "Party Ref No.",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: "-" },
      ],
      [
        {
          content: "Size",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: "40" },
        {
          content: "Party Advance",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: "-" },
      ],
      [
        {
          content: "Type",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.cargo_type || "Perishable" },
        {
          content: "Seal No",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: "-" },
      ],
      [
        {
          content: "Line",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.shipping_line || "MAERSK GROUP" },
        {
          content: "Factory Site Reporting",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: "-" },
      ],
      [
        {
          content: "Seal No",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: request.seal_number || "2527450" },
        {
          content: "Factory Site Release",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: "-" },
      ],
      [
        {
          content: "Pay Load",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: `${request.cargo_weight || "10000"}` },
        {
          content: "VIA",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: "-" },
      ],
      [
        {
          content: "Oil Slip No",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        { content: "00" },
        { content: "", styles: { colSpan: 2 } },
        "",
      ],
      [
        {
          content: "Port",
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
        {
          content: request.port || "RIYADH SAUDI ARABIA",
          styles: { colSpan: 3 },
        },
        "",
        "",
      ],
    ];

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 5,
      head: [],
      body: containerData,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: "left",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 35, fillColor: [240, 240, 240] },
        1: { cellWidth: 50 },
        2: { cellWidth: 35, fillColor: [240, 240, 240] },
        3: { cellWidth: 50 },
      },
    });

    // Signature sections
    const currentY = doc.lastAutoTable.finalY + 10;

    // Draw signature boxes
    doc.rect(14, currentY, 90, 40); // Left signature box
    doc.rect(105, currentY, 90, 40); // Right signature box

    doc.setFontSize(8);
    doc.text("FOR FACTORY STAMP & SIGNATURE", 16, currentY + 5);
    doc.text("Authorised Signatory", 107, currentY + 5);

    // Declaration section
    const declarationY = currentY + 50;
    doc.rect(14, declarationY, 181, 30); // Declaration box

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("DECLARATION", doc.internal.pageSize.width / 2, declarationY + 8, {
      align: "center",
    });

    doc.setFontSize(8);
    doc.text("Note:", 16, declarationY + 15);

    const declarationText = [
      "Goods are Transported at Owners risk.",
      "Company will not be responsible for the damage of goods, leakage and breakage.",
      "Consignee is responsible for the correctness of GSTIN & other details.",
      "All Matter of Disputes will be settled in DELHI Jurisdiction only.",
    ];

    declarationText.forEach((text, i) => {
      doc.text(`${i + 1}. ${text}`, 16, declarationY + 20 + i * 3);
    });
  });

  return doc;
};
