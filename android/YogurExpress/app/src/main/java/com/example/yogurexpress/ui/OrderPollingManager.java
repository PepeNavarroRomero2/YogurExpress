package com.example.yogurexpress.ui;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import com.example.yogurexpress.api.ApiClient;
import com.example.yogurexpress.models.Order;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class OrderPollingManager {

    private static final long POLLING_INTERVAL_MS = 15000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ApiClient apiClient;
    private final Set<Long> seenOrders = new HashSet<>();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private OrderPollingListener listener;
    private boolean running = false;
    private Context appContext;

    public interface OrderPollingListener {
        void onNewOrders();
    }

    public OrderPollingManager(Context context) {
        this.appContext = context.getApplicationContext();
        this.apiClient = new ApiClient(this.appContext);
    }

    public void setListener(OrderPollingListener listener) {
        this.listener = listener;
    }

    public void start(Context context) {
        this.appContext = context.getApplicationContext();
        if (running) return;
        running = true;
        handler.post(pollRunnable);
    }

    public void stop() {
        running = false;
        handler.removeCallbacksAndMessages(null);
    }

    private final Runnable pollRunnable = new Runnable() {
        @Override
        public void run() {
            if (!running) return;
            apiClient.getPendingOrders(new ApiClient.OrdersCallback() {
                @Override public void onSuccess(List<Order> orders) {
                    handleOrders(orders);
                    scheduleNext();
                }

                @Override public void onError(String msg) {
                    scheduleNext();
                }
            });
        }
    };

    private void handleOrders(List<Order> orders) {
        List<Order> safeList = orders != null ? orders : new ArrayList<>();
        if (seenOrders.isEmpty()) {
            for (Order o : safeList) {
                if (o != null && o.getId_pedido() != null) {
                    seenOrders.add(o.getId_pedido());
                }
            }
            return;
        }

        for (Order o : safeList) {
            if (o == null) continue;
            Long id = o.getId_pedido();
            if (id != null && !seenOrders.contains(id)) {
                seenOrders.add(id);
                NotificationHelper.showNewOrderNotification(appContext, o);
                if (listener != null) {
                    mainHandler.post(listener::onNewOrders);
                }
            }
        }
    }

    private void scheduleNext() {
        if (running) {
            handler.postDelayed(pollRunnable, POLLING_INTERVAL_MS);
        }
    }
}
