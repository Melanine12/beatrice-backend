const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

class PDFService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.ensureUploadsDir();
  }

    ensureUploadsDir() {
    try {
      if (!fs.existsSync(this.uploadsDir)) {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
        console.log('📁 Dossier uploads créé:', this.uploadsDir);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création du dossier uploads:', error);
      throw error;
    }
  }

  async generateTransactionsReport(caisse, transactions, summary) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔍 Début de la génération du PDF...');
        
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const filename = `rapport_transactions_${caisse.nom}_${new Date().toISOString().split('T')[0]}.pdf`;
        const filepath = path.join(this.uploadsDir, filename);
        
        console.log('📁 Chemin du fichier:', filepath);
        
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // En-tête du document
        console.log('📝 Ajout de l\'en-tête...');
        this.addHeader(doc, caisse);
        
        // Résumé du solde
        console.log('💰 Ajout du résumé du solde...');
        this.addBalanceSummary(doc, summary, caisse.devise);
        
        // Tableau des transactions
        console.log('📊 Ajout du tableau des transactions...');
        this.addTransactionsTable(doc, transactions, caisse.devise);
        
        // Pied de page
        console.log('📄 Ajout du pied de page...');
        this.addFooter(doc);

        console.log('✅ Finalisation du PDF...');
        doc.end();

        stream.on('finish', () => {
          console.log('✅ PDF généré avec succès:', filepath);
          resolve({ filename, filepath });
        });

        stream.on('error', (error) => {
          console.error('❌ Erreur du stream:', error);
          reject(error);
        });

      } catch (error) {
        console.error('❌ Erreur lors de la génération du PDF:', error);
        reject(error);
      }
    });
  }

  addHeader(doc, caisse) {
    // Titre principal
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('RAPPORT DES TRANSACTIONS', { align: 'center' })
       .moveDown(0.5);

    // Informations de la caisse
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(`Caisse: ${caisse.nom}`, { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Code: ${caisse.code_caisse}`, { align: 'center' })
       .text(`Devise: ${caisse.devise}`, { align: 'center' })
       .text(`Emplacement: ${caisse.emplacement || 'Non spécifié'}`, { align: 'center' })
       .moveDown(1);

    // Date de génération
    doc.fontSize(10)
       .font('Helvetica-Oblique')
       .text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'right' })
       .moveDown(1);

    // Ligne de séparation
    doc.moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .stroke()
       .moveDown(1);
  }

  addBalanceSummary(doc, summary, devise) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('RÉSUMÉ DU SOLDE', { underline: true })
       .moveDown(0.5);

    // Grille des informations
    const startY = doc.y;
    const colWidth = 120;
    const rowHeight = 25;

    // Solde Initial
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Solde Initial:', 50, startY)
       .font('Helvetica')
       .text(`${summary.soldeInitial} ${devise}`, 50 + colWidth, startY);

    // Total Paiements
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Total Paiements:', 50, startY + rowHeight)
       .font('Helvetica')
       .fillColor('green')
       .text(`+${summary.totalPaiements} ${devise}`, 50 + colWidth, startY + rowHeight)
       .fillColor('black');

    // Total Dépenses
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Total Dépenses:', 50, startY + rowHeight * 2)
       .font('Helvetica')
       .fillColor('red')
       .text(`-${summary.totalDepensesComplet} ${devise}`, 50 + colWidth, startY + rowHeight * 2)
       .fillColor('black');

    // Solde Calculé
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Solde Calculé:', 50, startY + rowHeight * 3)
       .font('Helvetica')
       .fillColor('purple')
       .text(`${summary.soldeCalcule} ${devise}`, 50 + colWidth, startY + rowHeight * 3)
       .fillColor('black');

    // Détail des dépenses
    doc.moveDown(1);
    doc.fontSize(10)
       .font('Helvetica-Oblique')
       .text(`Détail: Dépenses régulières: -${summary.totalDepenses} ${devise}, Paiements partiels: -${summary.totalPaiementsPartiels} ${devise}`)
       .moveDown(1);

    // Ligne de séparation
    doc.moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .stroke()
       .moveDown(1);
  }

  addTransactionsTable(doc, transactions, devise) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('DÉTAIL DES TRANSACTIONS', { underline: true })
       .moveDown(0.5);

    if (transactions.length === 0) {
      doc.fontSize(12)
         .font('Helvetica')
         .text('Aucune transaction trouvée.')
         .moveDown(1);
      return;
    }

    // En-têtes du tableau avec largeurs optimisées et positions calculées
    const headers = ['Date', 'Référence', 'Type', 'Montant', 'Statut', 'Description'];
    const colWidths = [70, 90, 80, 80, 70, 150];
    const colPositions = [50, 120, 210, 290, 370, 440]; // Positions X calculées
    const startY = doc.y;

    // Dessiner les en-têtes avec une couleur plus professionnelle
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('white');

    headers.forEach((header, index) => {
      doc.rect(colPositions[index], startY, colWidths[index], 25)
         .fillAndStroke('#2c3e50', '#34495e'); // Bleu foncé professionnel
      
      doc.fillColor('white')
         .text(header, colPositions[index] + 5, startY + 8, { width: colWidths[index] - 10, align: 'center' });
    });

    doc.fillColor('black');
    doc.moveDown(0.5);

    // Contenu du tableau avec hauteur de ligne adaptative et alignement précis
    let currentY = startY + 30;
    transactions.forEach((transaction, index) => {
      // Vérifier si on doit passer à la page suivante
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      // Calculer la hauteur nécessaire pour cette ligne
      const description = transaction.description || 'Aucune description';
      const descriptionLines = this.wrapText(description, colWidths[5] - 10, doc);
      const lineHeight = Math.max(35, descriptionLines.length * 16 + 20);

      // Ligne de fond avec couleurs plus douces
      if (index % 2 === 0) {
        doc.rect(50, currentY, 560, lineHeight)
           .fillAndStroke('#f8f9fa', '#e9ecef'); // Gris très clair avec bordure douce
      } else {
        doc.rect(50, currentY, 560, lineHeight)
           .fillAndStroke('white', '#e9ecef'); // Blanc avec bordure douce
      }

      // Date avec formatage amélioré - Position précise
      const date = transaction.date_paiement || transaction.date_depense || transaction.date;
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50') // Texte foncé pour la lisibilité
         .text(this.formatDate(date), colPositions[0] + 5, currentY + 12, { width: colWidths[0] - 10, align: 'left' });

      // Référence - Position précise
      const reference = transaction.reference || transaction.numero_facture || 'N/A';
      doc.font('Helvetica')
         .fillColor('#34495e')
         .text(reference, colPositions[1] + 5, currentY + 12, { width: colWidths[1] - 10, align: 'left' });

      // Type avec couleur selon le type - Position précise
      const type = transaction.type_paiement || 'N/A';
      const typeColor = this.getTypeColor(type);
      doc.font('Helvetica-Bold')
         .fillColor(typeColor)
         .text(type, colPositions[2] + 5, currentY + 12, { width: colWidths[2] - 10, align: 'left' });

      // Montant avec formatage et couleur - Position précise
      const montant = parseFloat(transaction.montant || 0).toFixed(2);
      const deviseText = transaction.devise || devise;
      const montantComplet = `${montant} ${deviseText}`;
      const montantColor = this.getMontantColor(transaction.type_paiement);
      doc.font('Helvetica-Bold')
         .fillColor(montantColor)
         .text(montantComplet, colPositions[3] + 5, currentY + 12, { width: colWidths[3] - 10, align: 'right' });

      // Statut avec couleur appropriée - Position précise
      const statut = transaction.statut || 'N/A';
      const statutColor = this.getStatutColor(statut);
      doc.font('Helvetica-Bold')
         .fillColor(statutColor)
         .text(statut, colPositions[4] + 5, currentY + 12, { width: colWidths[4] - 10, align: 'center' });

      // Description avec gestion du retour à la ligne et couleur - Position précise
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#2c3e50'); // Texte foncé pour la lisibilité
      
      let descY = currentY + 12;
      descriptionLines.forEach((line, lineIndex) => {
        doc.text(line, colPositions[5] + 5, descY, { width: colWidths[5] - 10, align: 'left' });
        descY += 16;
      });

      currentY += lineHeight + 3;
    });

    doc.moveDown(1);
  }

  addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 1; i <= pageCount; i++) {
      doc.switchToPage(i);
      
      // Numéro de page
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Page ${i} sur ${pageCount}`, 50, 800, { align: 'center' });
      
      // Ligne de séparation
      doc.moveTo(50, 790)
         .lineTo(545, 790)
         .stroke();
    }
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateLong(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  wrapText(text, maxWidth, doc) {
    if (!text || text.length === 0) return ['Aucune description'];
    
    // Nettoyer le texte des caractères spéciaux
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (cleanText.length === 0) return ['Aucune description'];
    
    const words = cleanText.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = doc.widthOfString(testLine);
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        // Si le mot seul est trop long, le couper
        if (doc.widthOfString(word) > maxWidth) {
          // Couper le mot en caractères
          let partialWord = '';
          for (let i = 0; i < word.length; i++) {
            const testChar = partialWord + word[i];
            if (doc.widthOfString(testChar) <= maxWidth) {
              partialWord = testChar;
            } else {
              if (partialWord) {
                lines.push(partialWord);
              }
              partialWord = word[i];
            }
          }
          if (partialWord) {
            currentLine = partialWord;
          } else {
            currentLine = '';
          }
        } else {
          currentLine = word;
        }
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // Limiter le nombre de lignes pour éviter les débordements
    if (lines.length > 5) {
      lines.splice(5);
      lines[4] = lines[4].substring(0, lines[4].length - 3) + '...';
    }
    
    return lines.length > 0 ? lines : ['Aucune description'];
  }

  getTypeColor(type) {
    switch (type) {
      case 'Espèces':
        return '#27ae60'; // Vert pour les espèces
      case 'Carte bancaire':
        return '#3498db'; // Bleu pour la carte
      case 'Chèque':
        return '#9b59b6'; // Violet pour le chèque
      case 'Virement':
        return '#e67e22'; // Orange pour le virement
      case 'Dépense':
        return '#e74c3c'; // Rouge pour les dépenses
      case 'Dépense Partielle':
        return '#c0392b'; // Rouge foncé pour les dépenses partielles
      default:
        return '#2c3e50'; // Bleu foncé par défaut
    }
  }

  getMontantColor(type) {
    if (type === 'Dépense' || type === 'Dépense Partielle') {
      return '#e74c3c'; // Rouge pour les dépenses
    } else {
      return '#27ae60'; // Vert pour les paiements
    }
  }

  getStatutColor(statut) {
    switch (statut) {
      case 'Validé':
        return '#27ae60'; // Vert pour validé
      case 'Approuvée':
        return '#3498db'; // Bleu pour approuvée
      case 'Payée':
        return '#27ae60'; // Vert pour payée
      case 'En attente':
        return '#f39c12'; // Orange pour en attente
      case 'Rejeté':
        return '#e74c3c'; // Rouge pour rejeté
      default:
        return '#2c3e50'; // Bleu foncé par défaut
    }
  }
}

module.exports = new PDFService();
