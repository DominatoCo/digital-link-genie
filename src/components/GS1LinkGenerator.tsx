import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Link2, CheckCircle2, Download, Play, Plus, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface GS1Data {
  domain: string;
  gtin: string;
  serialNumber: string;
  batchLot: string;
  expiryDate: string;
}

interface CustomAI {
  ai: string;
  value: string;
}

const GS1_AI_OPTIONS = [
  { value: "11", label: "11 - Production Date" },
  { value: "13", label: "13 - Packaging Date" },
  { value: "15", label: "15 - Best Before Date" },
  { value: "240", label: "240 - Additional Product ID" },
  { value: "241", label: "241 - Customer Part Number" },
  { value: "242", label: "242 - Made-to-Order Variation" },
  { value: "250", label: "250 - Secondary Serial Number" },
  { value: "251", label: "251 - Reference to Source Entity" },
  { value: "253", label: "253 - GDTI" },
  { value: "254", label: "254 - GLN Extension" },
  { value: "30", label: "30 - Variable Count" },
  { value: "37", label: "37 - Count of Trade Items" },
  { value: "400", label: "400 - Customer PO Number" },
  { value: "401", label: "401 - GINC" },
  { value: "402", label: "402 - GSIN" },
  { value: "403", label: "403 - Routing Code" },
  { value: "410", label: "410 - Ship To GLN" },
  { value: "420", label: "420 - Ship To Postal Code" },
  { value: "7003", label: "7003 - Expiry Date and Time" },
  { value: "7007", label: "7007 - Harvest Date" },
  { value: "8003", label: "8003 - GRAI" },
  { value: "8004", label: "8004 - GIAI" },
  { value: "8006", label: "8006 - Trade Item Piece ID" },
  { value: "8020", label: "8020 - Payment Slip Reference" },
  { value: "90", label: "90 - Internal Information" },
  { value: "91", label: "91 - Internal Information" },
  { value: "92", label: "92 - Internal Information" },
  { value: "93", label: "93 - Internal Information" },
  { value: "94", label: "94 - Internal Information" },
  { value: "95", label: "95 - Internal Information" },
  { value: "96", label: "96 - Internal Information" },
  { value: "97", label: "97 - Internal Information" },
  { value: "98", label: "98 - Internal Information" },
  { value: "99", label: "99 - Internal Information" },
];

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
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [customAIs, setCustomAIs] = useState<CustomAI[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

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

    // Add custom AIs
    customAIs.forEach(({ ai, value }) => {
      if (ai && value) {
        link += `/${ai}/${encodeURIComponent(value)}`;
      }
    });

    setGeneratedLink(link);
    toast.success("GS1 Digital Link успешно сгенерирована!");
  };

  const addCustomAI = () => {
    setCustomAIs([...customAIs, { ai: "", value: "" }]);
  };

  const removeCustomAI = (index: number) => {
    setCustomAIs(customAIs.filter((_, i) => i !== index));
  };

  const updateCustomAI = (index: number, field: "ai" | "value", newValue: string) => {
    const updated = [...customAIs];
    updated[index][field] = newValue;
    setCustomAIs(updated);
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

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = "gs1-qr-code.png";
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR-код загружен!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleVideoOpen = () => {
    setIsVideoOpen(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
      }
    }, 100);
  };

  const handleVideoEnded = () => {
    setIsVideoOpen(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Demo Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleVideoOpen}
            className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow text-base h-12 px-8"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Демо
          </Button>
        </div>

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

            {/* Custom AI Section */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Custom AI</Label>
                <Button
                  type="button"
                  onClick={addCustomAI}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Добавить AI
                </Button>
              </div>

              {customAIs.map((customAI, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm">AI Идентификатор</Label>
                    <Select
                      value={customAI.ai}
                      onValueChange={(value) => updateCustomAI(index, "ai", value)}
                    >
                      <SelectTrigger className="font-mono">
                        <SelectValue placeholder="Выберите AI" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {GS1_AI_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="font-mono">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm">Значение</Label>
                    <Input
                      type="text"
                      placeholder="Введите значение"
                      value={customAI.value}
                      onChange={(e) => updateCustomAI(index, "value", e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => removeCustomAI(index)}
                    variant="ghost"
                    size="icon"
                    className="mt-8 text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
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
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Сгенерированная ссылка</h3>
              </div>
              
              <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                <code className="text-sm md:text-base break-all text-foreground font-mono">
                  {generatedLink}
                </code>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
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
                      Копировать ссылку
                    </>
                  )}
                </Button>

                <Button
                  onClick={downloadQRCode}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Скачать QR-код
                </Button>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-4 pt-4 border-t border-border">
                <h4 className="font-semibold text-base">QR-код</h4>
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG
                    id="qr-code"
                    value={generatedLink}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Отсканируйте QR-код для перехода по ссылке
                </p>
              </div>
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

      {/* Video Dialog */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0">
          <video
            ref={videoRef}
            className="w-full h-auto"
            onEnded={handleVideoEnded}
            controls
          >
            <source src="/demo-video.mp4" type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GS1LinkGenerator;