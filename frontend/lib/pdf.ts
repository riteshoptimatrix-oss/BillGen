import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

/**
 * Robust PDF Generation Utility using html2canvas-pro + jsPDF.
 * 
 * html2canvas-pro natively parses modern CSS color spaces including:
 * lab(), lch(), oklab(), oklch(), and color(srgb/p3).
 */

async function preparePDFDoc(element: HTMLElement): Promise<{ pdf: jsPDF } | null> {
  if (typeof window === "undefined" || !element) return null;

  // Clone target to render at crisp A4 printable dimensions (210mm = ~794px @ 96dpi)
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.margin = "0";
  clone.style.padding = "24px";
  clone.style.boxShadow = "none";
  clone.style.width = "794px";
  clone.style.position = "fixed";
  clone.style.top = "-99999px";
  clone.style.left = "-99999px";
  clone.style.zIndex = "-9999";
  clone.style.backgroundColor = "#ffffff";
  document.body.appendChild(clone);

  try {
    // Ensure all images in clone have crossOrigin and are fully preloaded
    const cloneImgs = Array.from(clone.querySelectorAll("img"));
    await Promise.all(
      cloneImgs.map((img) => {
        img.crossOrigin = "anonymous";
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          // Timeout after 1.5 seconds so PDF generation proceeds smoothly even on slow networks
          setTimeout(resolve, 1500);
        });
      })
    );

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 794,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc: Document) => {
        // Ensure all cloned elements have solid readable backgrounds and no conflicting modern color glitches
        const el = clonedDoc.querySelector("[data-invoice-root]") as HTMLElement;
        if (el) {
          el.style.backgroundColor = "#ffffff";
        }
        // Force crossOrigin on all cloned image elements
        const imgs = clonedDoc.querySelectorAll("img");
        imgs.forEach((img) => {
          img.crossOrigin = "anonymous";
        });
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const pageHeight = pdf.internal.pageSize.getHeight();
    if (pdfHeight <= pageHeight) {
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    } else {
      let heightLeft = pdfHeight;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
    }

    return { pdf };
  } finally {
    if (clone.parentNode) {
      document.body.removeChild(clone);
    }
  }
}

export async function exportElementToPDF(element: HTMLElement, filename: string): Promise<void> {
  try {
    const result = await preparePDFDoc(element);
    if (result) {
      result.pdf.save(filename);
    }
  } catch (error) {
    console.error("PDF generation failed, falling back to print dialog:", error);
    window.print();
  }
}

export async function generatePDFFile(element: HTMLElement, filename: string): Promise<File | null> {
  try {
    const result = await preparePDFDoc(element);
    if (!result) return null;
    const blob = result.pdf.output("blob");
    return new File([blob], filename, { type: "application/pdf" });
  } catch (e) {
    console.error("Failed to generate PDF file object:", e);
    return null;
  }
}
