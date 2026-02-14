import { LoadingState, TableLoading } from "@/components/ui/LoadingState";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the PRO analytics table.
 */
export default function ProLoading() {
  return (
    <div className="theme-pro">
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <LoadingState title="Carregando tabela PRO">
          <div className="animate-pulse">
            <div className="p-5 pb-3">
              <Skeleton className="h-8 w-80 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>

            <div className="flex-1 px-5">
              <TableLoading rows={10} cols={9} />
            </div>
          </div>
        </LoadingState>
      </div>
    </div>
  );
}
