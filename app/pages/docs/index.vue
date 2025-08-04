<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <UIcon
              name="i-lucide-book-open"
              class="h-8 w-8 text-primary mr-3"
            />
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ useRuntimeConfig().public.APP_NAME }} Developer Documentation
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <UBadge
              color="primary"
              variant="soft"
            >
              v1.0
            </UBadge>
            <UButton
              to="/"
              color="primary"
              variant="outline"
              size="sm"
              icon="i-lucide-arrow-left"
            >
              Return to Dashboard
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="lg:grid lg:grid-cols-12 lg:gap-8">
        <!-- Sidebar Navigation -->
        <aside class="hidden lg:block lg:col-span-3">
          <nav class="sticky top-8 space-y-1">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Table of Contents
              </h2>
              <ul class="space-y-2 text-sm">
                <li>
                  <a
                    href="#overview"
                    class="text-primary hover:text-primary-600 font-medium"
                  >Overview</a>
                </li>
                <li>
                  <a
                    href="#getting-started"
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >Getting Started</a>
                </li>
                <li>
                  <a
                    href="#property-setup"
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >Property Setup</a>
                </li>
                <li>
                  <a
                    href="#floor-management"
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >Floor Management</a>
                </li>
                <li>
                  <a
                    href="#unit-management"
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >Unit Management</a>
                </li>
                <li>
                  <a
                    href="#tenant-management"
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >Tenant Management</a>
                </li>
                <li>
                  <a
                    href="#financial-management"
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >Financial Management</a>
                </li>
                <li>
                  <a
                    href="#services-maintenance"
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >Services & Maintenance</a>
                </li>
                <li>
                  <a
                    href="#user-management"
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >User Management</a>
                </li>
                <li>
                  <a
                    href="#billing-system"
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >Billing System</a>
                </li>
                <li>
                  <a
                    href="#best-practices"
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >Best Practices</a>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="lg:col-span-9">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div class="p-6 sm:p-8 space-y-8">
              <!-- Overview Section -->
              <section
                id="overview"
                class="scroll-mt-8"
              >
                <div class="flex items-center mb-6">
                  <UIcon
                    name="i-lucide-info"
                    class="h-6 w-6 text-primary mr-3"
                  />
                  <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Overview
                  </h2>
                </div>

                <UAlert
                  icon="i-lucide-lightbulb"
                  color="primary"
                  variant="soft"
                  title="Welcome Developer!"
                  class="mb-6"
                >
                  <template #description>
                    This documentation will guide you through the complete property management workflow for developers.
                    You'll learn how to set up properties, manage units, handle tenants, and oversee all aspects of your property portfolio.
                  </template>
                </UAlert>

                <div class="prose dark:prose-invert max-w-none">
                  <p class="text-lg text-gray-600 dark:text-gray-300 mb-4">
                    {{ useRuntimeConfig().public.APP_NAME }} is a comprehensive property management system designed specifically for property developers.
                    As a developer user, you have access to all features necessary to manage your property portfolio efficiently.
                  </p>

                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Key Features for Developers:
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="flex items-start space-x-3">
                      <UIcon
                        name="i-lucide-building-2"
                        class="h-5 w-5 text-green-500 mt-1 flex-shrink-0"
                      />
                      <div>
                        <h4 class="font-medium text-gray-900 dark:text-white">
                          Property Management
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Create and manage multiple properties with detailed layouts
                        </p>
                      </div>
                    </div>
                    <div class="flex items-start space-x-3">
                      <UIcon
                        name="i-lucide-layers"
                        class="h-5 w-5 text-blue-500 mt-1 flex-shrink-0"
                      />
                      <div>
                        <h4 class="font-medium text-gray-900 dark:text-white">
                          Floor & Unit Organization
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Structure properties with floors and individual units
                        </p>
                      </div>
                    </div>
                    <div class="flex items-start space-x-3">
                      <UIcon
                        name="i-lucide-users"
                        class="h-5 w-5 text-purple-500 mt-1 flex-shrink-0"
                      />
                      <div>
                        <h4 class="font-medium text-gray-900 dark:text-white">
                          Tenant Management
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Handle tenant assignments, leases, and occupancy
                        </p>
                      </div>
                    </div>
                    <div class="flex items-start space-x-3">
                      <UIcon
                        name="i-lucide-dollar-sign"
                        class="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0"
                      />
                      <div>
                        <h4 class="font-medium text-gray-900 dark:text-white">
                          Financial Tracking
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Monitor revenue, expenses, and financial performance
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Getting Started Section -->
              <section
                id="getting-started"
                class="scroll-mt-8"
              >
                <div class="flex items-center mb-6">
                  <UIcon
                    name="i-lucide-rocket"
                    class="h-6 w-6 text-primary mr-3"
                  />
                  <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Getting Started
                  </h2>
                </div>

                <UAlert
                  icon="i-lucide-shield-check"
                  color="warning"
                  variant="soft"
                  title="Authentication & Access Control"
                  class="mb-6"
                >
                  <template #description>
                    The system includes middleware that automatically redirects developers without properties to the property listing page.
                    You must have at least one property to access the main dashboard features.
                  </template>
                </UAlert>

                <div class="space-y-6">
                  <div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Initial Setup Workflow
                    </h3>
                    <div class="space-y-4">
                      <div class="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <div>
                          <h4 class="font-medium text-gray-900 dark:text-white">
                            Login as Developer
                          </h4>
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            Access the system with your developer credentials
                          </p>
                        </div>
                      </div>
                      <div class="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <div>
                          <h4 class="font-medium text-gray-900 dark:text-white">
                            Property Check
                          </h4>
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            If you have no properties, you'll be redirected to <code class="text-xs bg-gray-200 dark:bg-gray-600 px-1 rounded">/properties/listing</code>
                          </p>
                        </div>
                      </div>
                      <div class="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <div>
                          <h4 class="font-medium text-gray-900 dark:text-white">
                            Create First Property
                          </h4>
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            Add your first property to unlock all system features
                          </p>
                        </div>
                      </div>
                      <div class="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                          4
                        </div>
                        <div>
                          <h4 class="font-medium text-gray-900 dark:text-white">
                            Access Property Dashboard
                          </h4>
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            Navigate to <code class="text-xs bg-gray-200 dark:bg-gray-600 px-1 rounded">/properties</code> to view your property layout
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Property Setup Section -->
              <section
                id="property-setup"
                class="scroll-mt-8"
              >
                <div class="flex items-center mb-6">
                  <UIcon
                    name="i-lucide-building-2"
                    class="h-6 w-6 text-primary mr-3"
                  />
                  <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Property Setup
                  </h2>
                </div>

                <div class="space-y-6">
                  <div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Creating a Property
                    </h3>
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <h4 class="font-medium text-blue-900 dark:text-blue-200 mb-2">
                        Navigation Path:
                      </h4>
                      <code class="text-sm text-blue-800 dark:text-blue-300">/properties/listing → Add Property Button</code>
                    </div>

                    <div class="prose dark:prose-invert max-w-none">
                      <p class="mb-4">
                        When creating a new property, you'll need to provide:
                      </p>
                      <ul class="list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Property Name:</strong> A unique identifier for your property</li>
                        <li><strong>Location Details:</strong> Address and geographic information</li>
                        <li><strong>Property Type:</strong> Residential, commercial, or mixed-use</li>
                        <li><strong>Basic Configuration:</strong> Initial settings for the property</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Property Dashboard
                    </h3>
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <h4 class="font-medium text-blue-900 dark:text-blue-200 mb-2">
                        Navigation Path:
                      </h4>
                      <code class="text-sm text-blue-800 dark:text-blue-300">/properties</code>
                    </div>

                    <div class="prose dark:prose-invert max-w-none">
                      <p class="mb-4">
                        The property dashboard provides:
                      </p>
                      <ul class="list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Property Statistics:</strong> Overview of units, occupancy, and revenue</li>
                        <li><strong>Floor Layout:</strong> Visual representation of property structure</li>
                        <li><strong>Quick Actions:</strong> Add floors, edit property details</li>
                        <li><strong>Getting Started Guide:</strong> Helpful tips for new properties</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Floor Management Section -->
              <section
                id="floor-management"
                class="scroll-mt-8"
              >
                <div class="flex items-center mb-6">
                  <UIcon
                    name="i-lucide-layers"
                    class="h-6 w-6 text-primary mr-3"
                  />
                  <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Floor Management
                  </h2>
                </div>

                <div class="space-y-6">
                  <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 class="font-medium text-green-900 dark:text-green-200 mb-2">
                      Pro Tip:
                    </h4>
                    <p class="text-sm text-green-800 dark:text-green-300">
                      Structure your property logically with floors before adding units. This creates a clear hierarchy and makes navigation easier.
                    </p>
                  </div>

                  <div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Adding Floors
                    </h3>
                    <div class="prose dark:prose-invert max-w-none">
                      <p class="mb-4">
                        From the property dashboard, you can:
                      </p>
                      <ol class="list-decimal pl-5 space-y-2 mb-4">
                        <li>Click the <strong>"Add Floor"</strong> button</li>
                        <li>Specify floor number and details</li>
                        <li>Configure floor-specific settings</li>
                        <li>Save to create the floor structure</li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Floor Operations
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                          Adding Units to Floor
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Use the plus (+) icon on each floor to add new units
                        </p>
                      </div>
                      <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                          Editing Floor Details
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Use the edit icon to modify floor information
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Unit Management Section -->
              <section
                id="unit-management"
                class="scroll-mt-8"
              >
                <div class="flex items-center mb-6">
                  <UIcon
                    name="i-lucide-door-open"
                    class="h-6 w-6 text-primary mr-3"
                  />
                  <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Unit Management
                  </h2>
                </div>

                <div class="space-y-6">
                  <div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Units Overview
                    </h3>
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <h4 class="font-medium text-blue-900 dark:text-blue-200 mb-2">
                        Navigation Path:
                      </h4>
                      <code class="text-sm text-blue-800 dark:text-blue-300">/units</code>
                    </div>

                    <div class="prose dark:prose-invert max-w-none">
                      <p class="mb-4">
                        The units page provides comprehensive unit management with:
                      </p>
                      <ul class="list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Search & Filters:</strong> Find units by number, floor, or tenant</li>
                        <li><strong>Status Filtering:</strong> View occupied or vacant units</li>
                        <li><strong>Floor Filtering:</strong> Focus on specific floors</li>
                        <li><strong>Detailed Unit Cards:</strong> Quick overview of each unit's status</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Unit Detail Management
                    </h3>
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <h4 class="font-medium text-blue-900 dark:text-blue-200 mb-2">
                        Navigation Path:
                      </h4>
                      <code class="text-sm text-blue-800 dark:text-blue-300">/units/[id]?propertyId=[propertyId]</code>
                    </div>

                    <div class="prose dark:prose-invert max-w-none">
                      <p class="mb-4">
                        Individual unit pages offer detailed management including:
                      </p>

                      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        For Occupied Units:
                      </h4>
                      <ul class="list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Unit Details Card:</strong> Edit unit specifications and rent amount</li>
                        <li><strong>Payment Calendar:</strong> Track monthly payments and rental history</li>
                        <li><strong>Tenant Information:</strong> Manage tenant details and lease information</li>
                        <li><strong>Payment History:</strong> Complete payment transaction records</li>
                        <li><strong>Occupation History:</strong> Track previous and current tenants</li>
                      </ul>

                      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        For Vacant Units:
                      </h4>
                      <ul class="list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Unit Information Display:</strong> Type, category, furnishing, rent amount</li>
                        <li><strong>Ownership Details:</strong> Owner contact information (if applicable)</li>
                        <li><strong>Tenant Assignment:</strong> Easy tenant addition with assignment wizard</li>
                        <li><strong>Rental Options:</strong> Monthly rental, fixed-term lease, or owner-occupied</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Unit Actions
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <UIcon
                          name="i-lucide-edit"
                          class="h-5 w-5 text-blue-500 mb-2"
                        />
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                          Edit Unit
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Modify unit details, rent amount, and specifications
                        </p>
                      </div>
                      <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <UIcon
                          name="i-lucide-user-plus"
                          class="h-5 w-5 text-green-500 mb-2"
                        />
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                          Add Tenant
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Assign new tenants to vacant units
                        </p>
                      </div>
                      <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <UIcon
                          name="i-lucide-log-out"
                          class="h-5 w-5 text-red-500 mb-2"
                        />
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                          End Tenancy
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Process tenant move-outs and unit transitions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Tenant Management Section -->
              <section
                id="tenant-management"
                class="scroll-mt-8"
              >
                <div class="flex items-center mb-6">
                  <UIcon
                    name="i-lucide-users"
                    class="h-6 w-6 text-primary mr-3"
                  />
                  <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Tenant Management
                  </h2>
                </div>

                <div class="space-y-6">
                  <div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Tenant Listing
                    </h3>
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <h4 class="font-medium text-blue-900 dark:text-blue-200 mb-2">
                        Navigation Path:
                      </h4>
                      <code class="text-sm text-blue-800 dark:text-blue-300">/tenants/list</code>
                    </div>

                    <div class="prose dark:prose-invert max-w-none">
                      <p class="mb-4">
                        The tenant listing provides comprehensive tenant management with:
                      </p>
                      <ul class="list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Tenant Search:</strong> Find tenants by name, unit, or contact information</li>
                        <li><strong>Status Filters:</strong> Filter by tenancy status (active, inactive, etc.)</li>
                        <li><strong>Rental Type Filters:</strong> Filter by monthly, fixed-term, or owner-occupied</li>
                        <li><strong>Detailed Table View:</strong> Complete tenant information with unit assignments</li>
                        <li><strong>Pagination:</strong> Handle large tenant lists efficiently</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Tenant Types
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <UBadge
                          color="success"
                          variant="soft"
                          class="mb-2"
                        >
                          Monthly Rental
                        </UBadge>
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                          Standard Tenants
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Regular monthly rent payments with ongoing lease
                        </p>
                      </div>
                      <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <UBadge
                          color="info"
                          variant="soft"
                          class="mb-2"
                        >
                          Fixed-Term
                        </UBadge>
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                          Lease Tenants
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Specific lease duration with defined end date
                        </p>
                      </div>
                      <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <UBadge
                          color="warning"
                          variant="soft"
                          class="mb-2"
                        >
                          Owner-Occupied
                        </UBadge>
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">
                          Unit Owners
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Property owners living in their own units
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Financial Management Section -->
              <section
                id="financial-management"
                class="scroll-mt-8"
              >
                <div class="flex items-center mb-6">
                  <UIcon
                    name="i-lucide-bar-chart-3"
                    class="h-6 w-6 text-primary mr-3"
                  />
                  <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Financial Management
                  </h2>
                </div>

                <div class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <UIcon
                        name="i-lucide-receipt"
                        class="h-6 w-6 text-green-600 mb-2"
                      />
                      <h4 class="font-medium text-green-900 dark:text-green-200">
                        Expenses
                      </h4>
                      <p class="text-sm text-green-800 dark:text-green-300">
                        /expenses
                      </p>
                    </div>
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <UIcon
                        name="i-lucide-trending-up"
                        class="h-6 w-6 text-blue-600 mb-2"
                      />
                      <h4 class="font-medium text-blue-900 dark:text-blue-200">
                        Rental Income
                      </h4>
                      <p class="text-sm text-blue-800 dark:text-blue-300">
                        /income
                      </p>
                    </div>
                    <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <UIcon
                        name="i-lucide-home"
                        class="h-6 w-6 text-purple-600 mb-2"
                      />
                      <h4 class="font-medium text-purple-900 dark:text-purple-200">
                        Unit Sales
                      </h4>
                      <p class="text-sm text-purple-800 dark:text-purple-300">
                        /sales
                      </p>
                    </div>
                    <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <UIcon
                        name="i-lucide-arrow-up-right"
                        class="h-6 w-6 text-orange-600 mb-2"
                      />
                      <h4 class="font-medium text-orange-900 dark:text-orange-200">
                        Disbursements
                      </h4>
                      <p class="text-sm text-orange-800 dark:text-orange-300">
                        /disbursements
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Revenue Tracking
                    </h3>
                    <div class="prose dark:prose-invert max-w-none">
                      <p class="mb-4">
                        The financial management system provides comprehensive tracking of:
                      </p>
                      <ul class="list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Rental Income:</strong> Monthly rent collections and payment tracking</li>
                        <li><strong>Property Expenses:</strong> Maintenance, utilities, and operational costs</li>
                        <li><strong>Unit Sales:</strong> Revenue from unit sales and transfers</li>
                        <li><strong>Disbursements:</strong> Payments to owners and stakeholders</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Services & Maintenance Section -->
              <section
                id="services-maintenance"
                class="scroll-mt-8"
              >
                <div class="flex items-center mb-6">
                  <UIcon
                    name="i-lucide-briefcase"
                    class="h-6 w-6 text-primary mr-3"
                  />
                  <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Services & Maintenance
                  </h2>
                </div>

                <div class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Service Management
                      </h3>
                      <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span class="text-sm font-medium text-gray-900 dark:text-white">Tenant Services</span>
                          <code class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">/services/tenant</code>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span class="text-sm font-medium text-gray-900 dark:text-white">Unit Commission</span>
                          <code class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">/services/owner</code>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Maintenance System
                      </h3>
                      <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span class="text-sm font-medium text-gray-900 dark:text-white">Maintenance Requests</span>
                          <code class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">/maintenance</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- User Management Section -->
              <section
                id="user-management"
                class="scroll-mt-8"
              >
                <div class="flex items-center mb-6">
                  <UIcon
                    name="i-lucide-users"
                    class="h-6 w-6 text-primary mr-3"
                  />
                  <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                    User Management
                  </h2>
                </div>

                <div class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Admin Users
                      </h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Manage system administrators and their permissions
                      </p>
                      <code class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">/users</code>
                    </div>
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Tenant Users
                      </h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        View and manage all tenant accounts and access
                      </p>
                      <code class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">/tenants/list</code>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Billing System Section -->
              <section
                id="billing-system"
                class="scroll-mt-8"
              >
                <div class="flex items-center mb-6">
                  <UIcon
                    name="i-lucide-scroll"
                    class="h-6 w-6 text-primary mr-3"
                  />
                  <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Billing System
                  </h2>
                </div>

                <div class="space-y-6">
                  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <h4 class="font-medium text-blue-900 dark:text-blue-200 mb-2">
                      Navigation Path:
                    </h4>
                    <code class="text-sm text-blue-800 dark:text-blue-300">/billing</code>
                  </div>

                  <div class="prose dark:prose-invert max-w-none">
                    <p class="mb-4">
                      The billing system handles:
                    </p>
                    <ul class="list-disc pl-5 space-y-1 mb-4">
                      <li><strong>Invoice Generation:</strong> Automated monthly billing for tenants</li>
                      <li><strong>Payment Tracking:</strong> Monitor payment status and history</li>
                      <li><strong>Service Charges:</strong> Include additional services in billing</li>
                      <li><strong>Payment Methods:</strong> Support for various payment options</li>
                    </ul>
                  </div>
                </div>
              </section>

              <!-- Best Practices Section -->
              <section
                id="best-practices"
                class="scroll-mt-8"
              >
                <div class="flex items-center mb-6">
                  <UIcon
                    name="i-lucide-lightbulb"
                    class="h-6 w-6 text-primary mr-3"
                  />
                  <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Best Practices
                  </h2>
                </div>

                <div class="space-y-6">
                  <UAlert
                    icon="i-lucide-target"
                    color="success"
                    variant="soft"
                    title="Recommended Workflow"
                    class="mb-6"
                  >
                    <template #description>
                      Follow this sequence for optimal property management: Property Setup → Floor Structure → Unit Creation → Tenant Assignment → Service Configuration → Financial Monitoring
                    </template>
                  </UAlert>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Property Organization
                      </h3>
                      <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Create logical floor numbering system</li>
                        <li>• Use consistent unit naming conventions</li>
                        <li>• Set up property details completely before adding units</li>
                        <li>• Configure services before tenant assignments</li>
                      </ul>
                    </div>
                    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Tenant Management
                      </h3>
                      <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Verify tenant information before unit assignment</li>
                        <li>• Choose appropriate rental type for each tenant</li>
                        <li>• Set up payment schedules and service charges</li>
                        <li>• Regular monitoring of payment status</li>
                      </ul>
                    </div>
                    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Financial Tracking
                      </h3>
                      <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Regular expense entry and categorization</li>
                        <li>• Monitor revenue trends and patterns</li>
                        <li>• Keep detailed records of all transactions</li>
                        <li>• Review financial reports monthly</li>
                      </ul>
                    </div>
                    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        System Maintenance
                      </h3>
                      <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Regular data backups and system updates</li>
                        <li>• User access review and management</li>
                        <li>• Performance monitoring and optimization</li>
                        <li>• Documentation of process changes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Footer -->
              <div class="border-t border-gray-200 dark:border-gray-700 pt-8 mt-12">
                <div class="text-center text-gray-600 dark:text-gray-400">
                  <p class="text-sm">
                    {{ useRuntimeConfig().public.APP_NAME }} Developer Documentation v1.0
                  </p>
                  <p class="text-xs mt-2">
                    For technical support or feature requests, contact your system administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  title: 'Documentation',
  layout: 'empty',
})
</script>

<style scoped>
html {
  scroll-behavior: smooth;
}
</style>
