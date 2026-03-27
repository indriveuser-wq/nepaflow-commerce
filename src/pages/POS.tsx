import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingBag, ShoppingCart } from "lucide-react";
import { formatNPR } from "@/lib/formatters";
import { useProductStore } from "@/stores/product-store";
import { usePOSStore } from "@/stores/pos-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { POSCart } from "@/components/pos/POSCart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export default function POS() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const store = usePOSStore();
  const { products, categories } = useProductStore();
  const isMobile = useIsMobile();

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    return matchesSearch && matchesCategory && p.status === 'active';
  });

  const addProduct = (product: typeof products[0]) => {
    store.addItem({ product_id: product.id, name: product.name, price: product.selling_price, quantity: 1, discount: 0, is_custom: false, notes: '' });
  };

  const productGrid = (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search or scan barcode..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" autoFocus />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[100px] md:w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
          {filteredProducts.map(p => (
            <Card key={p.id} className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all active:scale-[0.97]" onClick={() => addProduct(p)}>
              <CardContent className="p-2.5 md:p-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-accent flex items-center justify-center mb-1.5">
                  <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 text-accent-foreground" />
                </div>
                <p className="font-medium text-xs md:text-sm line-clamp-2 leading-tight">{p.name}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{p.sku}</p>
                <p className="font-bold text-xs md:text-sm mt-0.5">{formatNPR(p.selling_price)}</p>
              </CardContent>
            </Card>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">No products found</div>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {productGrid}
        <Sheet>
          <SheetTrigger asChild>
            <Button size="lg" className="fixed bottom-[4.5rem] right-4 z-40 rounded-full h-14 w-14 shadow-lg">
              <ShoppingCart className="h-5 w-5" />
              {store.items.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {store.items.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl flex flex-col p-0">
            <POSCart className="flex flex-col h-full" />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4">
      {productGrid}
      <Card className="w-[380px] flex flex-col shrink-0">
        <POSCart className="flex flex-col h-full" />
      </Card>
    </div>
  );
}
