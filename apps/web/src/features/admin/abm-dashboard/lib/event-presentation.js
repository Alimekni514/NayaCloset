import { CircleCheckBig, Package, PackageCheck, PackagePlus, RefreshCw, TriangleAlert, Truck, Undo2, Warehouse, } from 'lucide-react';
export const eventPresentationMap = {
    1: { order: 10, tone: 'created', icon: PackagePlus, fallbackLabel: 'Colis crees' },
    5: { order: 20, tone: 'danger', icon: TriangleAlert, fallbackLabel: "Anomalies d'enlevement" },
    4: { order: 30, tone: 'success', icon: PackageCheck, fallbackLabel: 'Colis enleves' },
    20: { order: 40, tone: 'danger', icon: TriangleAlert, fallbackLabel: 'Anomalies de livraison' },
    25: { order: 50, tone: 'success', icon: CircleCheckBig, fallbackLabel: 'Colis livres' },
    3: { order: 60, tone: 'progress', icon: Truck, fallbackLabel: 'Enlevements en cours' },
    26: { order: 70, tone: 'info', icon: Warehouse, fallbackLabel: 'Colis au depot' },
    18: { order: 80, tone: 'progress', icon: Truck, fallbackLabel: 'Livraisons en cours' },
    99: { order: 90, tone: 'info', icon: Undo2, fallbackLabel: 'Colis retour depot' },
    29: { order: 10, tone: 'return', icon: Undo2, fallbackLabel: 'Retours generes' },
    32: { order: 20, tone: 'progress', icon: Truck, fallbackLabel: 'Retours en cours' },
    34: { order: 30, tone: 'danger', icon: TriangleAlert, fallbackLabel: 'Anomalies de retour' },
    33: { order: 40, tone: 'success', icon: CircleCheckBig, fallbackLabel: 'Colis retournes' },
    36: { order: 10, tone: 'created', icon: RefreshCw, fallbackLabel: 'Echanges generes' },
    37: { order: 20, tone: 'progress', icon: Truck, fallbackLabel: 'Echanges en cours' },
    40: { order: 30, tone: 'danger', icon: TriangleAlert, fallbackLabel: "Anomalies d'echange" },
    39: { order: 40, tone: 'success', icon: CircleCheckBig, fallbackLabel: 'Echanges effectues' },
};
export const defaultEventPresentation = {
    order: 999,
    tone: 'neutral',
    icon: Package,
    fallbackLabel: 'Indicateur ABM',
};
export const expectedGroupEventIds = {
    POSITION: [1, 5, 4, 20, 25, 3, 26, 18, 99],
    RETOUR: [29, 32, 34, 33],
    ECHANGE: [36, 37, 40, 39],
};
