import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Link2, CheckCircle2 } from "lucide-react";

interface GS1Data {
  domain: string;
  gtin: string;
  serialNumber: string;
  batchLot: string;
  expiryDate: string;
}

const GS1LinkGenerator = () => {
  const [data, setData] = useState<GS1Data>({
    domain: "https://example.com",
    gtin: "",
    serialNumber: "",
    batchLot: "",
    expiryDate: "",
  });
  
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const validateGTIN = (gtin: string): boolean => {
    if (!gtin) return false;
    const cleanGtin = gtin.replace(/\D/g, '');
    return cleanGtin.length === 8 || cleanGtin.length === 12 || cleanGtin.length === 13 || cleanGtin.length === 14;
  };

  const formatDate = (date: string): string => {
    if (!date) return '';
    const cleanDate = date.replace(/\D/g, '');
    if (cleanDate.length === 6) {
      return cleanDate;
    }
    return '';
  };

  const generateLink = () => {
    if (!data.gtin) {
      toast.error("GTIN обязателен для генерации ссылки");
      return;
    }

    if (!validateGTIN(data.gtin)) {
      toast.error("GTIN должен содержать 8, 12, 13 или 14 цифр");
      return;
    }

    let link = `${data.domain.replace(/\/$/, '')}/01/${data.gtin.replace(/\D/g, '')}`;

    if (data.serialNumber) {
      link += `/21/${encodeURIComponent(data.serialNumber)}`;
    }

    if (data.batchLot) {
      link += `/10/${encodeURIComponent(data.batchLot)}`;
    }

    if (data.expiryDate) {
      const formattedDate = formatDate(data.expiryDate);
      if (formattedDate) {
        link += `/17/${formattedDate}`;
      }
    }

    setGeneratedLink(link);
    toast.success("GS1 Digital Link успешно сгенерирована!");
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Ссылка скопирована в буфер обмена!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-glow mb-4">
            <Link2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            GS1 Digital Link Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Создайте стандартизированные веб-ссылки для ваших товаров
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-6 md:p-8 bg-gradient-card shadow-card border-border/50">
          <div className="space-y-6">
            {/* Domain */}
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-base font-semibold">
                Домен *
              </Label>
              <Input
                id="domain"
                type="url"
                placeholder="https://example.com"
                value={data.domain}
                onChange={(e) => setData({ ...data, domain: e.target.value })}
                className="text-base"
              />
            </div>

            {/* GTIN */}
            <div className="space-y-2">
              <Label htmlFor="gtin" className="text-base font-semibold">
                GTIN (Global Trade Item Number) *
              </Label>
              <Input
                id="gtin"
                type="text"
                placeholder="12345678901231"
                value={data.gtin}
                onChange={(e) => setData({ ...data, gtin: e.target.value })}
                className="text-base font-mono"
              />
              <p className="text-sm text-muted-foreground">
                8, 12, 13 или 14 цифр
              </p>
            </div>

            {/* Serial Number */}
            <div className="space-y-2">
              <Label htmlFor="serialNumber" className="text-base font-semibold">
                Серийный номер (AI 21)
              </Label>
              <Input
                id="serialNumber"
                type="text"
                placeholder="ABC123XYZ"
                value={data.serialNumber}
                onChange={(e) => setData({ ...data, serialNumber: e.target.value })}
                className="text-base font-mono"
              />
            </div>

            {/* Batch/Lot */}
            <div className="space-y-2">
              <Label htmlFor="batchLot" className="text-base font-semibold">
                Номер партии (AI 10)
              </Label>
              <Input
                id="batchLot"
                type="text"
                placeholder="LOT2024001"
                value={data.batchLot}
                onChange={(e) => setData({ ...data, batchLot: e.target.value })}
                className="text-base font-mono"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiryDate" className="text-base font-semibold">
                Срок годности (AI 17)
              </Label>
              <Input
                id="expiryDate"
                type="text"
                placeholder="YYMMDD: 251231"
                value={data.expiryDate}
                onChange={(e) => setData({ ...data, expiryDate: e.target.value })}
                className="text-base font-mono"
                maxLength={6}
              />
              <p className="text-sm text-muted-foreground">
                Формат: ГГММДД (например, 251231 для 31 декабря 2025)
              </p>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={generateLink}
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow text-base h-12"
              size="lg"
            >
              <Link2 className="w-5 h-5 mr-2" />
              Сгенерировать ссылку
            </Button>
          </div>
        </Card>

        {/* Result Card */}
        {generatedLink && (
          <Card className="p-6 md:p-8 bg-gradient-card shadow-card border-success/20 animate-in slide-in-from-bottom-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Сгенерированная ссылка</h3>
              </div>
              
              <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                <code className="text-sm md:text-base break-all text-foreground font-mono">
                  {generatedLink}
                </code>
              </div>

              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                    Скопировано!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Копировать в буфер обмена
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Info Card */}
        <Card className="p-6 bg-muted/50 border-border/50">
          <h3 className="font-semibold mb-3 text-base">О GS1 Digital Link</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              GS1 Digital Link - это веб-URI синтаксис для представления идентификаторов GS1.
            </p>
            <p className="font-mono text-xs bg-background/50 p-2 rounded border border-border">
              Пример: https://example.com/01/12345678901231/21/ABC123
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>01</strong> - GTIN (обязательно)</li>
              <li><strong>21</strong> - Серийный номер</li>
              <li><strong>10</strong> - Номер партии</li>
              <li><strong>17</strong> - Срок годности (ГГММДД)</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GS1LinkGenerator;