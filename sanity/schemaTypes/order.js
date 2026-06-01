import { defineType, defineField } from 'sanity'

export const order = defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  fields: [
    // Customer Info
    defineField({
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      validation: (Rule) => Rule.required().regex(/^[0-9+\-\\s]+$/, {
        name: 'phone number',
        invert: false,
      }),
    }),
    defineField({
      name: 'fullAddress',
      title: 'Full Address',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),

    // Order Metadata
    defineField({
      name: 'orderId',
      title: 'Order ID',
      type: 'string',
      description: 'Auto-generated Order ID',
    }),
    defineField({
      name: 'razorpayPaymentId',
      title: 'Payment Reference ID',
      type: 'string',
    }),
    defineField({
      name: 'totalAmount',
      title: 'Total Amount',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),

    // Cart Items
    defineField({
      name: 'cartItems',
      title: 'Cart Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'product',
              title: 'Product',
              type: 'reference',
              to: [{ type: 'product' }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
              validation: (Rule) => Rule.required().min(1),
            }),
            defineField({
              name: 'size',
              title: 'Size/Variant',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              title: 'product.name',
              subtitle: 'size',
              media: 'product.image', // Assuming the product schema has an image field
            },
            prepare({ title, subtitle, media }) {
              return {
                title: title || 'Unknown Product',
                subtitle: subtitle ? `Size: ${subtitle}` : '',
                media: media,
              }
            },
          },
        },
      ],
    }),

    // Logistics & Tracking
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'Pending' },
          { title: 'Processing', value: 'Processing' },
          { title: 'Shipped', value: 'Shipped' },
          { title: 'Delivered', value: 'Delivered' },
          { title: 'Cancelled', value: 'Cancelled' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'Pending',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'trackingId',
      title: 'Tracking ID',
      type: 'string',
    }),
    defineField({
      name: 'courierName',
      title: 'Courier Name',
      type: 'string',
    }),

    // Internal Notes
    defineField({
      name: 'internalNotes',
      title: 'Internal Notes',
      type: 'text',
      description: 'Internal notes for admin use only',
    }),

    defineField({
      name: 'returnStatus',
      title: 'Return Status',
      type: 'string',
      options: {
        list: [
          { title: 'No Return', value: 'No Return' },
          { title: 'Pending Approval', value: 'Pending Approval' },
          { title: 'Approved', value: 'Approved' },
          { title: 'Rejected', value: 'Rejected' },
          { title: 'Returned', value: 'Returned' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'No Return',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'returnReason',
      title: 'Return Reason',
      type: 'text',
      description: 'Customer-provided reason and notes for the return request',
    }),
    defineField({
      name: 'returnImages',
      title: 'Return Images',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Array of proof image URLs or data URLs supplied by the customer',
    }),
    defineField({
      name: 'ekartReturnTrackingId',
      title: 'Ekart Return Tracking ID',
      type: 'string',
      description: 'Ekart tracking ID for the reverse pickup or return shipment',
    }),
  ],
  preview: {
    select: {
      title: 'customerName',
      subtitle: 'status',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Unknown Customer',
        subtitle: `Status: ${subtitle || 'Unknown'}`,
      }
    },
  },
})
