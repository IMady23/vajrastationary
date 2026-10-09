import { format } from 'date-fns'

interface ReceiptData {
  shopName: string
  address: string
  customerPhone?: string
  customerName?: string
  items: { name: string; quantity: number; price: number }[]
  total: number
}

export const generateReceiptPDF = async (data: ReceiptData) => {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ])
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const date = format(new Date(), 'dd MMM yyyy, hh:mm a')

  // Header
  doc.setFontSize(22)
  doc.setTextColor(40)
  doc.text(data.shopName, pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  const addressLines = doc.splitTextToSize(data.address || 'Alugunoor, Karimnagar', 80)
  doc.text(addressLines, pageWidth / 2, 28, { align: 'center' })

  // Divider
  doc.setDrawColor(200)
  doc.line(15, 45, pageWidth - 15, 45)

  // Bill Info
  doc.setFontSize(10)
  doc.setTextColor(40)
  doc.text(`Date: ${date}`, 15, 55)
  if (data.customerName) {
    doc.text(`Customer: ${data.customerName}`, 15, 60)
    if (data.customerPhone) {
      doc.text(`Phone: ${data.customerPhone}`, 15, 65)
    }
  } else if (data.customerPhone) {
    doc.text(`Customer Phone: ${data.customerPhone}`, 15, 60)
  }

  // Items Table
  const tableRows = data.items.map((item, index) => [
    index + 1,
    item.name,
    item.quantity,
    `INR ${item.price}`,
    `INR ${item.price * item.quantity}`
  ])

  autoTable(doc, {
    startY: 70,
    head: [['#', 'Item', 'Qty', 'Price', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 15, right: 15 }
  })

  const finalY = (doc as any).lastAutoTable.finalY || 70

  // Total
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Grand Total: INR ${data.total}`, pageWidth - 15, finalY + 15, { align: 'right' })

  // Footer
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150)
  doc.text('Thank you for shopping with us!', pageWidth / 2, finalY + 30, { align: 'center' })
  doc.text('Visit again!', pageWidth / 2, finalY + 35, { align: 'center' })

  // Save the PDF
  doc.save(`Receipt_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`)
}
