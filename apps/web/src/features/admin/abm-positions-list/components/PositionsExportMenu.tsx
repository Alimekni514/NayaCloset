import { Copy, Download, FileText, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  onCopy: () => void;
  onCsv: () => void;
  onExcel: () => void;
  onPrint: () => void;
}

export function PositionsExportMenu({ onCopy, onCsv, onExcel, onPrint }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" id="positions-export-btn">
          <Download className="size-4" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={onCopy}>
          <Copy className="size-4" />
          Copier
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onCsv}>
          <FileText className="size-4" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExcel}>
          <FileText className="size-4" />
          Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onPrint}>
          <Printer className="size-4" />
          Imprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
