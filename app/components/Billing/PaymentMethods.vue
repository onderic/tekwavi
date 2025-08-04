<template>
  <UCard>
    <div class="flex items-center space-x-2 mb-4">
      <UIcon
        name="i-lucide-credit-card"
        class="h-6 w-6 text-purple-500 dark:text-purple-400"
      />
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
        Payment Method
      </h2>
    </div>

    <div class="space-y-4">
      <UCard class="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center">
              <span class="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-800 dark:text-gray-200">M-Pesa</span>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Mobile money payment
              </p>
            </div>
          </div>
          <UBadge
            color="success"
            variant="subtle"
            size="sm"
          >
            Active
          </UBadge>
        </div>
      </UCard>

      <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div class="flex items-start space-x-2">
          <UIcon
            name="i-lucide-info"
            class="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0"
          />
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <p class="font-medium mb-1">
              How M-Pesa payments work:
            </p>
            <ul class="space-y-1 list-disc list-inside">
              <li>You'll receive a push notification on your phone</li>
              <li>Enter your M-Pesa PIN to confirm payment</li>
              <li>Payment is processed instantly</li>
              <li>You'll receive an SMS confirmation</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div class="flex items-center space-x-2">
          <UIcon
            name="i-lucide-shield-check"
            class="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0"
          />
          <p class="text-sm text-blue-800 dark:text-blue-200">
            Secure payments powered by Safaricom M-Pesa
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
</script>
