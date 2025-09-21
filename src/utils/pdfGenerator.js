/**
 * PDF Report Generator Utility
 * Handles the generation of PDF reports for allergy tracking data
 */

export const generatePDFReport = async ({
  timeRange,
  symptoms,
  allergies,
  getSeverityStats,
  getSymptomFrequency,
  getFilteredSymptoms
}) => {
  try {
    // Dynamically import jsPDF to avoid SSR issues
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;
    
    // Helper function to add text with word wrapping
    const addText = (text, x, y, options = {}) => {
      const { fontSize = 12, fontStyle = 'normal', maxWidth = pageWidth - 40 } = options;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.5);
    };

    // Header
    doc.setFillColor(59, 130, 246); // Blue background
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    yPosition = addText('Health Report - Allergy Tracker', 20, 20, { fontSize: 20, fontStyle: 'bold' });
    
    doc.setTextColor(0, 0, 0);
    yPosition = 50;
    
    // Date range
    const timeRangeText = timeRange === "7" ? "week" : timeRange === "30" ? "month" : timeRange === "90" ? "3 months" : "year";
    yPosition = addText(`Report Period: Past ${timeRangeText}`, 20, yPosition, { fontSize: 14, fontStyle: 'bold' });
    yPosition = addText(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition + 10, { fontSize: 10 });
    yPosition += 20;

    // Summary Statistics
    yPosition = addText('Summary Statistics', 20, yPosition, { fontSize: 16, fontStyle: 'bold' });
    yPosition += 10;
    
    const filteredSymptoms = getFilteredSymptoms();
    const severityStats = getSeverityStats();
    const avgPerDay = (filteredSymptoms.length / parseInt(timeRange)).toFixed(1);
    
    yPosition = addText(`• Total Symptoms Logged: ${filteredSymptoms.length}`, 30, yPosition);
    yPosition = addText(`• Average Symptoms per Day: ${avgPerDay}`, 30, yPosition + 8);
    yPosition = addText(`• Tracked Allergies: ${allergies.length}`, 30, yPosition + 8);
    yPosition = addText(`• Unique Symptom Types: ${Object.keys(getSymptomFrequency().reduce((acc, [name]) => ({ ...acc, [name]: true }), {})).length}`, 30, yPosition + 8);
    yPosition += 20;

    // Severity Breakdown
    yPosition = addText('Severity Distribution', 20, yPosition, { fontSize: 16, fontStyle: 'bold' });
    yPosition += 10;
    
    const total = Object.values(severityStats).reduce((a, b) => a + b, 0);
    Object.entries(severityStats).forEach(([severity, count]) => {
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      yPosition = addText(`• ${severity.charAt(0).toUpperCase() + severity.slice(1)}: ${count} (${percentage}%)`, 30, yPosition);
      yPosition += 8;
    });
    yPosition += 15;

    // Most Common Symptoms
    yPosition = addText('Most Common Symptoms', 20, yPosition, { fontSize: 16, fontStyle: 'bold' });
    yPosition += 10;
    
    const symptomFreq = getSymptomFrequency();
    symptomFreq.slice(0, 10).forEach(([symptom, count], index) => {
      yPosition = addText(`${index + 1}. ${symptom}: ${count} occurrences`, 30, yPosition);
      yPosition += 8;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
    });

    // Recent Symptoms (if space allows)
    if (yPosition < pageHeight - 80) {
      yPosition += 15;
      yPosition = addText('Recent Symptom Log', 20, yPosition, { fontSize: 16, fontStyle: 'bold' });
      yPosition += 10;
      
      filteredSymptoms.slice(0, 15).forEach((symptom) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        
        const dateStr = symptom.date.toLocaleDateString();
        const timeStr = symptom.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        yPosition = addText(`• ${symptom.name} (${symptom.severity}) - ${dateStr} at ${timeStr}`, 30, yPosition);
        yPosition += 8;
      });
    }

    // Recommendations (new page)
    doc.addPage();
    yPosition = 20;
    
    yPosition = addText('Recommendations', 20, yPosition, { fontSize: 16, fontStyle: 'bold' });
    yPosition += 15;
    
    const severeCount = severityStats.severe + severityStats.emergency;
    const severePercentage = total > 0 ? (severeCount / total) * 100 : 0;
    
    if (severePercentage > 20) {
      yPosition = addText('⚠️ High percentage of severe symptoms detected. Consider scheduling an appointment with an allergist or healthcare provider.', 20, yPosition, { maxWidth: pageWidth - 40 });
      yPosition += 20;
    }
    
    if (parseFloat(avgPerDay) > 3) {
      yPosition = addText('💡 High daily symptom frequency. Review your environment and daily routine to identify potential triggers.', 20, yPosition, { maxWidth: pageWidth - 40 });
      yPosition += 20;
    }
    
    if (allergies.length === 0) {
      yPosition = addText('📝 Consider adding your known allergies to the app for more personalized insights and recommendations.', 20, yPosition, { maxWidth: pageWidth - 40 });
      yPosition += 20;
    }
    
    yPosition = addText('✅ Continue logging symptoms regularly to track patterns and identify trends over time.', 20, yPosition, { maxWidth: pageWidth - 40 });
    yPosition += 20;
    
    if (symptomFreq[0]) {
      yPosition = addText(`🔍 Focus on managing "${symptomFreq[0][0]}" as it's your most frequent symptom.`, 20, yPosition, { maxWidth: pageWidth - 40 });
      yPosition += 20;
    }

    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by Allergy Tracker App - Always consult with healthcare professionals for medical advice', 20, footerY);
    
    // Save the PDF
    const fileName = `allergy-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return { success: true, fileName };
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};