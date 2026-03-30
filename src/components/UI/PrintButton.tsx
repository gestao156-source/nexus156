import { useState } from 'react';
import { Printer } from 'lucide-react';
import { useHistoricoProcedimentos } from '../../hooks/useHistoricoProcedimentos';

interface PrintButtonProps {
  item: any;
  itemType?: 'solicitacao' | 'demanda';
}

export default function PrintButton({ item, itemType = 'solicitacao' }: PrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Buscar histórico de procedimentos
  const { historico, formatarData } = useHistoricoProcedimentos({
    itemId: item.id,
    itemTipo: itemType
  });

  const handlePrint = () => {
    setIsPrinting(true);
    
    // Criar conteúdo de impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Impressão - ${item.protocolo || 'N/A'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0;
            padding: 15px;
            line-height: 1.4;
            color: #333;
            background: #fff;
            font-size: 11px;
          }
          
          .container {
            max-width: 100%;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #ddd;
          }
          
          .header { 
            background: #ffffff;
            border-bottom: 2px solid #2563eb;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .print-date {
            font-size: 11px;
            color: #6b7280;
          }
          
          .protocol-number {
            font-size: 12px;
            font-weight: 700;
            color: #2563eb;
          }
          
          .section { 
            border-bottom: 1px solid #e5e7eb;
            padding: 15px 20px;
          }
          
          .section:last-child {
            border-bottom: none;
          }
          
          .section-title {
            font-size: 12px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-left: 3px solid #2563eb;
            padding-left: 8px;
          }
          
          .info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
          }
          
          .info-item { 
            display: flex;
            flex-direction: column;
          }
          
          .info-label { 
            font-size: 10px; 
            color: #6b7280; 
            margin-bottom: 2px; 
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .info-value { 
            font-size: 11px; 
            font-weight: 600; 
            color: #1f2937;
          }
          
          .status-badge { 
            display: inline-block; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 9px; 
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .status-finalizado { 
            background: #d4edda; 
            color: #155724; 
            border: 1px solid #c3e6cb;
          }
          
          .status-em_analise { 
            background: #fff3cd; 
            color: #856404; 
            border: 1px solid #ffeaa7;
          }
          
          .status-aguardando { 
            background: #e2e3e5; 
            color: #383d41; 
            border: 1px solid #d6d8db;
          }
          
          .footer { 
            background: #f8f9fa;
            color: #6b7280;
            padding: 10px 20px;
            text-align: center;
            font-size: 10px;
            border-top: 1px solid #e5e7eb;
            font-weight: 500;
          }
          
          /* Estilos para Histórico de Procedimentos */
          .procedimento-item {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
            background: #ffffff;
            page-break-inside: avoid;
          }
          
          .procedimento-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 11px;
          }
          
          .procedimento-data {
            color: #6b7280;
            font-weight: 500;
          }
          
          .procedimento-usuario {
            color: #374151;
            font-weight: 600;
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
          }
          
          .procedimento-texto {
            color: #1f2937;
            line-height: 1.4;
            font-size: 12px;
            margin-bottom: 6px;
          }
          
          .procedimento-migrado {
            font-size: 10px;
            color: #6b7280;
            font-style: italic;
            border-top: 1px solid #f3f4f6;
            padding-top: 6px;
            margin-top: 6px;
          }
          
          @media print {
            body { 
              margin: 0;
              padding: 10px;
              font-size: 9px;
            }
            
            .container {
              border: 1px solid #ccc;
            }
            
            .header {
              border-bottom: 2px solid #2563eb !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .section {
              page-break-inside: avoid;
              padding: 10px 15px;
            }
            
            .status-badge {
              border: 1px solid #333 !important;
            }
            
            .footer {
              border-top: 1px solid #ccc !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            @page { 
              margin: 10mm; 
              size: A4;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
        <div class="header">
          <div class="print-date">Impressão em ${new Date().toLocaleDateString('pt-BR')}</div>
          <div class="protocol-number">Protocolo: ${item.protocolo || 'N/A'}</div>
        </div>

        <div class="section">
          <div class="section-title">Dados do Protocolo</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Situação</div>
              <div class="info-value">
                <span class="status-badge status-${item.status || 'pendente'}">
                  ${item.status === 'finalizado' ? 'Finalizado' :
                    item.status === 'em_analise' ? 'Em Análise' :
                    item.status === 'aguardando' ? 'Aguardando' :
                    'Pendente'}
                </span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Responsável</div>
              <div class="info-value">${item.responsavel_profile?.full_name || item.responsavel || 'Não atribuído'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Dados do Atendimento</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Tipo</div>
              <div class="info-value">${item.tipo === 'solicitacao' ? 'Solicitação' : 'Demanda'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Data da Criação</div>
              <div class="info-value">${new Date(item.created_at).toLocaleDateString('pt-BR')}</div>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-label">Assunto</div>
              <div class="info-value">${item.assunto || 'Sem assunto'}</div>
            </div>
          </div>
        </div>

        ${(item.endereco_rua || item.endereco_bairro || item.endereco_cep) ? `
        <div class="section">
          <div class="section-title">Dados do Endereço</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Tipo</div>
              <div class="info-value">Logradouro</div>
            </div>
            <div class="info-item">
              <div class="info-label">Número</div>
              <div class="info-value">${item.endereco_numero || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Complemento</div>
              <div class="info-value">${item.endereco_complemento || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">CEP</div>
              <div class="info-value">${item.endereco_cep || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Bairro</div>
              <div class="info-value">${item.endereco_bairro || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Regional</div>
              <div class="info-value">${item.endereco_localidade || 'Fortaleza'}</div>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-label">Logradouro Completo</div>
              <div class="info-value">${item.endereco_rua || 'N/A'}</div>
            </div>
          </div>
        </div>` : ''}

        <div class="section">
          <div class="section-title">Histórico de Procedimentos</div>
          ${historico.length === 0 ? 
            '<div class="procedimento-item"><em>Nenhum procedimento registrado</em></div>' :
            historico.map((proc, index) => `
              <div class="procedimento-item">
                <div class="procedimento-header">
                  <span class="procedimento-data">${formatarData(proc.created_at)}</span>
                  <span class="procedimento-usuario">${proc.usuario_nome}</span>
                </div>
                <div class="procedimento-texto">${proc.procedimento}</div>
                ${index === historico.length - 1 && proc.procedimento.startsWith('Observação original:') ? 
                  '<div class="procedimento-migrado">📋 Registro migrado do campo observações original</div>' : ''}
              </div>
            `).join('')
          }
        </div>

        <div class="footer">
          NEXUS 156 - Sistema de Gerenciamento de Demandas
        </div>
      </div>
      </body>
      </html>
    `;

    // Abrir nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Aguardar carregamento e imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          setIsPrinting(false);
        }, 500);
      };
    } else {
      setIsPrinting(false);
      alert('Não foi possível abrir a janela de impressão. Verifique as configurações do seu navegador.');
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPrinting ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Imprimindo...</span>
        </>
      ) : (
        <>
          <Printer className="w-4 h-4" />
          <span>Imprimir</span>
        </>
      )}
    </button>
  );
}

