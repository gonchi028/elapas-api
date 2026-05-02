import * as fs from 'fs';
import * as path from 'path';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfmake = require('pdfmake/build/pdfmake') as {
  addFonts: (fonts: Record<string, unknown>) => void;
  virtualfs: { writeFileSync: (name: string, data: Buffer) => void };
  createPdf: (def: TDocumentDefinitions) => {
    getBuffer: () => Promise<Buffer>;
  };
};

const fontsDir = path.join(process.cwd(), 'node_modules/pdfmake/fonts/Roboto');

const fontFiles = [
  'Roboto-Regular.ttf',
  'Roboto-Medium.ttf',
  'Roboto-Italic.ttf',
  'Roboto-MediumItalic.ttf',
];

for (const file of fontFiles) {
  pdfmake.virtualfs.writeFileSync(
    file,
    fs.readFileSync(path.join(fontsDir, file)),
  );
}

pdfmake.addFonts({
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
});

export interface FacturaPdfData {
  factura: {
    id: string;
    periodo: string;
    consumoM3: number;
    cargoFijo: string | null;
    subtotal: string | null;
    total: string;
    estado: string;
    fechaVencimiento: string;
    createdAt: Date;
  };
  contrato: {
    nroContrato: string;
    nroMedidor: string;
    direccion: string;
  };
  usuario: {
    name: string;
    email: string;
  };
  distrito: {
    nombre: string;
    codigo: string;
  };
  lectura: {
    valorLectura: number;
    fechaLectura: Date;
  };
  tarifa: {
    nombre: string;
    tramoMin: number | null;
    tramoMax: number | null;
    precioM3: string;
    cargoFijo: string;
  };
}

const estadoLabel: Record<string, string> = {
  pendiente: 'PENDIENTE',
  pagada: 'PAGADA',
  vencida: 'VENCIDA',
};

const estadoColor: Record<string, string> = {
  pendiente: '#f59e0b',
  pagada: '#22c55e',
  vencida: '#ef4444',
};

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return `Bs ${n.toFixed(2)}`;
}

export function buildFacturaDoc(data: FacturaPdfData): TDocumentDefinitions {
  const { factura, contrato, usuario, distrito, lectura, tarifa } = data;

  return {
    pageSize: 'LETTER',
    pageMargins: [40, 100, 40, 60],

    header: {
      columns: [
        {
          stack: [
            { text: 'ELAPAS', style: 'companyName' },
            {
              text: 'Empresa de Agua Potable y Alcantarillado',
              fontSize: 9,
              color: '#6b7280',
            },
          ],
          alignment: 'left',
          margin: [40, 30, 0, 0],
        },
        {
          stack: [
            { text: 'FACTURA', style: 'invoiceTitle' },
            {
              text: estadoLabel[factura.estado] ?? factura.estado.toUpperCase(),
              fontSize: 9,
              color: estadoColor[factura.estado] ?? '#6b7280',
              bold: true,
              alignment: 'right',
            },
          ],
          alignment: 'right',
          margin: [0, 30, 40, 0],
        },
      ],
    },

    footer: (currentPage, pageCount) => ({
      columns: [
        {
          text: `Generado el ${formatDate(new Date())}`,
          fontSize: 8,
          color: '#9ca3af',
          margin: [40, 0, 0, 0],
        },
        {
          text: `Página ${currentPage} de ${pageCount}`,
          fontSize: 8,
          color: '#9ca3af',
          alignment: 'right',
          margin: [0, 0, 40, 0],
        },
      ],
    }),

    content: [
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'DATOS DEL USUARIO', style: 'sectionTitle' },
              {
                table: {
                  widths: ['auto', '*'],
                  body: [
                    ['Nombre:', usuario.name],
                    ['Email:', usuario.email],
                  ],
                },
                layout: 'noBorders',
                style: 'infoTable',
              },
            ],
          },
          {
            width: '*',
            stack: [
              { text: 'DATOS DEL CONTRATO', style: 'sectionTitle' },
              {
                table: {
                  widths: ['auto', '*'],
                  body: [
                    ['N° Contrato:', contrato.nroContrato],
                    ['N° Medidor:', contrato.nroMedidor],
                    ['Dirección:', contrato.direccion],
                    ['Distrito:', `${distrito.nombre} (${distrito.codigo})`],
                  ],
                },
                layout: 'noBorders',
                style: 'infoTable',
              },
            ],
          },
        ],
        columnGap: 20,
      },

      { text: '', margin: [0, 15] },

      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 1,
            lineColor: '#e5e7eb',
          },
        ],
      },

      { text: '', margin: [0, 10] },

      { text: 'DETALLE DE FACTURACIÓN', style: 'sectionTitle' },

      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Descripción', style: 'tableHeader' },
              { text: 'Cantidad', style: 'tableHeader', alignment: 'right' },
              {
                text: 'Precio Unit.',
                style: 'tableHeader',
                alignment: 'right',
              },
              { text: 'Subtotal', style: 'tableHeader', alignment: 'right' },
            ],
            [
              {
                stack: [
                  {
                    text: `Consumo de agua - Período ${factura.periodo}`,
                    bold: true,
                  },
                  {
                    text: `Lectura: ${lectura.valorLectura} m³ | Tarifa: ${tarifa.nombre} (${tarifa.tramoMin ?? 0} - ${tarifa.tramoMax ?? '∞'} m³)`,
                    fontSize: 9,
                    color: '#6b7280',
                  },
                ],
              },
              { text: `${factura.consumoM3} m³`, alignment: 'right' },
              { text: formatCurrency(tarifa.precioM3), alignment: 'right' },
              {
                text: formatCurrency(factura.subtotal ?? '0'),
                alignment: 'right',
              },
            ],
            [
              { text: 'Cargo fijo', colSpan: 3 },
              {},
              {},
              {
                text: formatCurrency(factura.cargoFijo ?? '0'),
                alignment: 'right',
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb',
        },
      },

      { text: '', margin: [0, 5] },

      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            table: {
              widths: [120, 'auto'],
              body: [
                [
                  { text: 'SUBTOTAL', style: 'totalLabel' },
                  {
                    text: formatCurrency(factura.subtotal ?? '0'),
                    style: 'totalValue',
                  },
                ],
                [
                  { text: 'CARGO FIJO', style: 'totalLabel' },
                  {
                    text: formatCurrency(factura.cargoFijo ?? '0'),
                    style: 'totalValue',
                  },
                ],
                [
                  { text: 'TOTAL A PAGAR', style: 'totalLabelFinal' },
                  {
                    text: formatCurrency(factura.total),
                    style: 'totalValueFinal',
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: (i, node) =>
                i === 0 || i === node.table.body.length ? 1 : 0.5,
              vLineWidth: () => 0,
              hLineColor: (i, node) =>
                i === node.table.body.length ? '#1e40af' : '#e5e7eb',
            },
          },
        ],
      },

      { text: '', margin: [0, 15] },

      {
        columns: [
          {
            width: '*',
            stack: [
              {
                table: {
                  widths: ['*', '*'],
                  body: [
                    [
                      {
                        stack: [
                          {
                            text: 'Período de facturación',
                            fontSize: 9,
                            color: '#6b7280',
                          },
                          { text: factura.periodo, bold: true },
                        ],
                      },
                      {
                        stack: [
                          {
                            text: 'Fecha de vencimiento',
                            fontSize: 9,
                            color: '#6b7280',
                          },
                          {
                            text: formatDate(factura.fechaVencimiento),
                            bold: true,
                          },
                        ],
                      },
                    ],
                  ],
                },
                layout: 'noBorders',
              },
            ],
          },
          {
            width: 80,
            alignment: 'center',
            stack: [
              {
                qr: factura.id,
                fit: 70,
                alignment: 'center',
              },
              {
                text: 'ID de factura',
                fontSize: 7,
                color: '#9ca3af',
                alignment: 'center',
                margin: [0, 2, 0, 0],
              },
            ],
          },
        ],
      },
    ],

    styles: {
      companyName: {
        fontSize: 20,
        bold: true,
        color: '#1e40af',
      },
      invoiceTitle: {
        fontSize: 20,
        bold: true,
        color: '#1e3a5f',
      },
      sectionTitle: {
        fontSize: 11,
        bold: true,
        color: '#374151',
        marginBottom: 6,
      },
      infoTable: {
        fontSize: 10,
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        fillColor: '#1e40af',
        color: 'white',
        margin: [4, 4, 4, 4],
      },
      totalLabel: {
        fontSize: 10,
        color: '#6b7280',
        margin: [4, 4, 4, 4],
      },
      totalValue: {
        fontSize: 10,
        alignment: 'right',
        margin: [4, 4, 4, 4],
      },
      totalLabelFinal: {
        fontSize: 12,
        bold: true,
        color: '#1e40af',
        margin: [4, 6, 4, 6],
      },
      totalValueFinal: {
        fontSize: 12,
        bold: true,
        color: '#1e40af',
        alignment: 'right',
        margin: [4, 6, 4, 6],
      },
    },

    defaultStyle: {
      fontSize: 10,
      color: '#1f2937',
      lineHeight: 1.3,
    },
  };
}

export class PdfService {
  async generateFacturaPdf(data: FacturaPdfData): Promise<Buffer> {
    const docDefinition = buildFacturaDoc(data);
    const pdf = pdfmake.createPdf(docDefinition);
    return pdf.getBuffer();
  }
}
