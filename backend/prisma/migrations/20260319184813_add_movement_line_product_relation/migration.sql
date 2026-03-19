-- AddForeignKey
ALTER TABLE "MovementLine" ADD CONSTRAINT "MovementLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
