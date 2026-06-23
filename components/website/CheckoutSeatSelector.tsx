"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Box, Minus, Plus, RotateCcw, Rows3 } from "lucide-react";
import type { PublicTicketType } from "@/shared/types/public-event.types";

type Props = {
    capacity?: number | null;
    ticketTypes?: PublicTicketType[];
};

type TicketSelection = Record<string, number>;
type ViewMode = "zones" | "threeD";

function formatMoney(amount: number, currency: string) {
    return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

function getTickets(capacity?: number | null, ticketTypes?: PublicTicketType[]) {
    const totalFromTickets = ticketTypes?.reduce((sum, ticket) => sum + ticket.quantity, 0) || 0;
    const totalCapacity = capacity || totalFromTickets || 0;
    const tickets = (ticketTypes || []).filter((ticket) => ticket.quantity > 0);

    return {
        totalCapacity,
        tickets: [...tickets].sort((a, b) => b.price - a.price),
    };
}

export default function CheckoutSeatSelector({ capacity, ticketTypes }: Props) {
    const { totalCapacity, tickets } = useMemo(() => getTickets(capacity, ticketTypes), [capacity, ticketTypes]);
    const [selection, setSelection] = useState<TicketSelection>({});
    const [viewMode, setViewMode] = useState<ViewMode>("zones");

    const selectedTickets = tickets
        .map((ticket) => ({ ticket, quantity: selection[ticket.id] || 0 }))
        .filter((item) => item.quantity > 0);

    const selectedTotal = selectedTickets.reduce((sum, item) => sum + item.ticket.price * item.quantity, 0);
    const currency = selectedTickets[0]?.ticket.currency || tickets[0]?.currency || "USD";

    const updateQuantity = (ticket: PublicTicketType, delta: number) => {
        setSelection((current) => {
            const nextQuantity = Math.max(0, Math.min(ticket.quantity, (current[ticket.id] || 0) + delta));
            return { ...current, [ticket.id]: nextQuantity };
        });
    };

    return (
        <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-lg bg-slate-100 p-1">
                    <button
                        type="button"
                        onClick={() => setViewMode("zones")}
                        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-extrabold ${viewMode === "zones" ? "bg-white text-[#005995] shadow-sm" : "text-slate-600"}`}
                    >
                        <Rows3 className="h-4 w-4" />
                        Plan des zones
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("threeD")}
                        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-extrabold ${viewMode === "threeD" ? "bg-white text-[#005995] shadow-sm" : "text-slate-600"}`}
                    >
                        <Box className="h-4 w-4" />
                        Vue 3D
                    </button>
                </div>
                <p className="text-sm font-bold text-slate-500">
                    Données réelles: {totalCapacity.toLocaleString("fr-FR")} places
                </p>
            </div>

            <div className="rounded-xl border bg-[#EEF3FA] p-5">
                {viewMode === "zones" ? (
                    <>
                        <div className="mx-auto h-12 max-w-lg rounded-b-[80%] bg-[#131827] text-center text-sm font-extrabold uppercase tracking-widest text-white shadow-lg">
                            <span className="inline-block pt-3">Stage</span>
                        </div>
                        <TicketTypeControls
                            tickets={tickets}
                            totalCapacity={totalCapacity}
                            selection={selection}
                            updateQuantity={updateQuantity}
                        />
                    </>
                ) : (
                    <Venue3DPreview tickets={tickets} totalCapacity={totalCapacity} />
                )}
            </div>

            {viewMode === "threeD" && (
                <TicketTypeControls
                    tickets={tickets}
                    totalCapacity={totalCapacity}
                    selection={selection}
                    updateQuantity={updateQuantity}
                    className="mt-6"
                />
            )}

            <div className="mt-6 rounded-xl border bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-extrabold uppercase tracking-widest text-slate-500">Sélection</p>
                        <p className="mt-2 text-2xl font-extrabold text-[#131827]">
                            {selectedTickets.length
                                ? selectedTickets.map((item) => `${item.quantity}x ${item.ticket.name}`).join(", ")
                                : "Aucun billet sélectionné"}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                            Capacité événement: {totalCapacity.toLocaleString("fr-FR")} places
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-500">Total billets</p>
                        <p className="text-3xl font-extrabold text-[#005995]">{formatMoney(selectedTotal, currency)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelection({})}
                        className="inline-flex items-center gap-2 rounded-lg border px-4 py-3 font-bold text-slate-700"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}

function TicketTypeControls({
    tickets,
    totalCapacity,
    selection,
    updateQuantity,
    className = "mt-8",
}: {
    tickets: PublicTicketType[];
    totalCapacity: number;
    selection: TicketSelection;
    updateQuantity: (ticket: PublicTicketType, delta: number) => void;
    className?: string;
}) {
    return (
        <div className={`${className} grid gap-5`}>
            {!tickets.length && (
                <div className="rounded-xl border bg-white p-6 text-center shadow-sm">
                    <h3 className="text-xl font-extrabold text-[#131827]">Aucun type de billet configuré</h3>
                    <p className="mt-2 text-slate-600">La visualisation utilise uniquement les billets réels de l'événement.</p>
                </div>
            )}
            {tickets.map((ticket, index) => {
                const width = totalCapacity ? Math.max(8, (ticket.quantity / totalCapacity) * 100) : 100;
                const selected = selection[ticket.id] || 0;

                return (
                    <section key={ticket.id} className="rounded-xl border bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                                    Zone {index + 1}
                                </p>
                                <h3 className="mt-1 text-2xl font-extrabold text-[#131827]">{ticket.name}</h3>
                                <p className="mt-1 text-sm font-bold text-slate-500">
                                    {ticket.quantity.toLocaleString("fr-FR")} billets disponibles sur {totalCapacity.toLocaleString("fr-FR")} places
                                </p>
                            </div>
                            <span className="rounded-full bg-[#D9EAFE] px-4 py-2 text-sm font-extrabold text-[#005995]">
                                {formatMoney(ticket.price, ticket.currency)}
                            </span>
                        </div>

                        <div className="mt-5 h-5 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className={index === 0 ? "h-full rounded-full bg-[#005995]" : "h-full rounded-full bg-[#B45A00]"}
                                style={{ width: `${width}%` }}
                            />
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                            <div className="text-sm font-bold text-slate-600">
                                {index === 0 ? "Zone avant / tarif le plus élevé" : "Zone suivante"}
                            </div>
                            <div className="inline-flex items-center overflow-hidden rounded-lg border bg-white">
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(ticket, -1)}
                                    className="flex h-11 w-11 items-center justify-center text-slate-700 hover:bg-slate-50"
                                    aria-label={`Retirer ${ticket.name}`}
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="min-w-12 px-4 text-center font-extrabold text-[#131827]">{selected}</span>
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(ticket, 1)}
                                    className="flex h-11 w-11 items-center justify-center bg-[#005995] text-white hover:bg-[#004b7d]"
                                    aria-label={`Ajouter ${ticket.name}`}
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

function Venue3DPreview({
    tickets,
    totalCapacity,
}: {
    tickets: PublicTicketType[];
    totalCapacity: number;
}) {
    const mountRef = useRef<HTMLDivElement>(null);
    const colors = useMemo(() => ["#005995", "#B45A00", "#0872B8", "#0F766E", "#7C3AED"], []);
    const seatUnit = totalCapacity > 30000 ? Math.ceil(totalCapacity / 30000) : 1;

    useEffect(() => {
        const container = mountRef.current;
        if (!container || !tickets.length || !totalCapacity) return;

        const width = container.clientWidth || 900;
        const height = container.clientHeight || 500;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#EAF1F8");
        scene.fog = new THREE.Fog("#EAF1F8", 42, 95);

        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 220);
        camera.position.set(0, 25, 42);
        camera.lookAt(0, 4, 7);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.replaceChildren(renderer.domElement);

        const ambient = new THREE.HemisphereLight("#ffffff", "#8BA7C1", 2.2);
        scene.add(ambient);

        const keyLight = new THREE.DirectionalLight("#ffffff", 2.8);
        keyLight.position.set(14, 24, 10);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        scene.add(keyLight);

        const rimLight = new THREE.PointLight("#26B8FF", 3, 80);
        rimLight.position.set(-18, 8, -14);
        scene.add(rimLight);

        const venue = new THREE.Group();
        scene.add(venue);

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(72, 62),
            new THREE.MeshStandardMaterial({ color: "#DDE8F3", roughness: 0.88, metalness: 0.02 }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, -0.05, 8);
        floor.receiveShadow = true;
        venue.add(floor);

        const stage = new THREE.Group();
        const stageBase = new THREE.Mesh(
            new THREE.BoxGeometry(22, 1.25, 5),
            new THREE.MeshStandardMaterial({ color: "#121827", roughness: 0.55, metalness: 0.08 }),
        );
        stageBase.position.set(0, 0.65, -16);
        stageBase.castShadow = true;
        stageBase.receiveShadow = true;
        stage.add(stageBase);

        const stageBack = new THREE.Mesh(
            new THREE.BoxGeometry(24, 6, 0.55),
            new THREE.MeshStandardMaterial({ color: "#0C1220", roughness: 0.5, metalness: 0.12 }),
        );
        stageBack.position.set(0, 3.7, -18.4);
        stageBack.castShadow = true;
        stage.add(stageBack);

        const stageGlow = new THREE.Mesh(
            new THREE.PlaneGeometry(22, 3.8),
            new THREE.MeshBasicMaterial({ color: "#005995", transparent: true, opacity: 0.22 }),
        );
        stageGlow.position.set(0, 3.8, -18.08);
        stage.add(stageGlow);
        venue.add(stage);

        const seatGeometry = new THREE.BoxGeometry(0.18, 0.2, 0.18);
        const dummy = new THREE.Object3D();
        let globalRow = 0;

        tickets.forEach((ticket, ticketIndex) => {
            const visibleSeats = Math.max(1, Math.ceil(ticket.quantity / seatUnit));
            const material = new THREE.MeshStandardMaterial({
                color: colors[ticketIndex % colors.length],
                roughness: 0.5,
                metalness: 0.08,
            });
            const mesh = new THREE.InstancedMesh(seatGeometry, material, visibleSeats);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            let placed = 0;
            while (placed < visibleSeats) {
                const seatsInRow = Math.min(visibleSeats - placed, Math.max(22, Math.min(230, Math.round(34 + globalRow * 2.2))));
                const rowWidth = Math.max(7, seatsInRow * 0.24);
                const zBase = -10 + globalRow * 0.36;
                const yBase = 0.25 + globalRow * 0.055;

                for (let seatIndex = 0; seatIndex < seatsInRow; seatIndex += 1) {
                    const normalized = seatsInRow === 1 ? 0 : seatIndex / (seatsInRow - 1) - 0.5;
                    const x = normalized * rowWidth;
                    const curve = Math.abs(normalized) * 4.8;
                    const z = zBase + curve;
                    const y = yBase + Math.abs(normalized) * 0.5;

                    dummy.position.set(x, y, z);
                    dummy.rotation.set(-0.08, -normalized * 0.62, 0);
                    dummy.scale.setScalar(1);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(placed, dummy.matrix);
                    placed += 1;
                }

                globalRow += 1;
            }

            mesh.instanceMatrix.needsUpdate = true;
            venue.add(mesh);
        });

        const aisleMaterial = new THREE.MeshStandardMaterial({ color: "#C7D6E6", roughness: 0.9 });
        [-1, 1].forEach((side) => {
            const aisle = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 46), aisleMaterial);
            aisle.position.set(side * 18, 0.08, 9);
            aisle.rotation.y = side * 0.24;
            aisle.receiveShadow = true;
            venue.add(aisle);
        });

        let frameId = 0;
        let yaw = 0;
        let dragging = false;
        let lastX = 0;

        const onPointerDown = (event: PointerEvent) => {
            dragging = true;
            lastX = event.clientX;
            renderer.domElement.setPointerCapture(event.pointerId);
        };
        const onPointerMove = (event: PointerEvent) => {
            if (!dragging) return;
            yaw += (event.clientX - lastX) * 0.006;
            lastX = event.clientX;
        };
        const onPointerUp = (event: PointerEvent) => {
            dragging = false;
            if (renderer.domElement.hasPointerCapture(event.pointerId)) {
                renderer.domElement.releasePointerCapture(event.pointerId);
            }
        };
        const onResize = () => {
            const nextWidth = container.clientWidth || width;
            const nextHeight = container.clientHeight || height;
            camera.aspect = nextWidth / nextHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(nextWidth, nextHeight);
        };

        renderer.domElement.addEventListener("pointerdown", onPointerDown);
        renderer.domElement.addEventListener("pointermove", onPointerMove);
        renderer.domElement.addEventListener("pointerup", onPointerUp);
        renderer.domElement.addEventListener("pointercancel", onPointerUp);
        window.addEventListener("resize", onResize);

        const animate = (time: number) => {
            venue.rotation.y = yaw + Math.sin(time * 0.00035) * 0.08;
            camera.lookAt(0, 3.8, 7);
            renderer.render(scene, camera);
            frameId = window.requestAnimationFrame(animate);
        };
        frameId = window.requestAnimationFrame(animate);

        return () => {
            window.cancelAnimationFrame(frameId);
            window.removeEventListener("resize", onResize);
            renderer.domElement.removeEventListener("pointerdown", onPointerDown);
            renderer.domElement.removeEventListener("pointermove", onPointerMove);
            renderer.domElement.removeEventListener("pointerup", onPointerUp);
            renderer.domElement.removeEventListener("pointercancel", onPointerUp);
            seatGeometry.dispose();
            scene.traverse((object: any) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach((material: any) => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            renderer.dispose();
            container.replaceChildren();
        };
    }, [colors, seatUnit, tickets, totalCapacity]);

    if (!tickets.length || !totalCapacity) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-[#DCE8F4] to-[#F8FBFF] p-4 md:p-6">
            <div className="relative mx-auto h-[500px] max-w-5xl overflow-hidden rounded-xl bg-[#EAF1F8]">
                <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
                <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/95 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-600 shadow-sm backdrop-blur">
                    Vraie vue 3D WebGL
                </div>
                <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-white/95 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-600 shadow-sm backdrop-blur">
                    1 siège = {seatUnit.toLocaleString("fr-FR")} place{seatUnit > 1 ? "s" : ""}
                </div>

                <div className="absolute bottom-4 left-4 right-4 grid gap-2 md:grid-cols-2">
                    {tickets.map((ticket, index) => (
                        <div key={ticket.id} className="rounded-lg bg-white/90 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm backdrop-blur">
                            <span style={{ color: colors[index % colors.length] }}>{ticket.name}</span>
                            <span className="ml-2 text-slate-500">
                                {ticket.quantity.toLocaleString("fr-FR")} places • {formatMoney(ticket.price, ticket.currency)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
