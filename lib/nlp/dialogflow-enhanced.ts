/**
 * Enhanced Dialogflow Integration with Better Entity Extraction
 * 
 * This file provides better logging and handles multiple parameter name variations
 * that Dialogflow might use based on different training phrase structures.
 */

// Copy this function to replace parseDialogflowResponse in lib/nlp/dialogflow.ts

function parseDialogflowResponseEnhanced(data: any, rawQuery: string): DialogflowResponse {
  const queryResult = data.queryResult || {};
  const intent = queryResult.intent || {};
  const parameters = queryResult.parameters || {};

  // Map Dialogflow intent name to our type
  const intentName = intent.displayName || 'fallback';
  const mappedIntent = mapIntentName(intentName);
  
  // Extract confidence
  const confidence = queryResult.intentDetectionConfidence || 0;

  // Extract entities from parameters - try multiple parameter name variations
  // Dialogflow might use different names based on how you configured the intent
  const entities: DialogflowEntity = {};
  
  // Product extraction - try all possible parameter names
  const productCandidates = [
    parameters.product,
    parameters['product-name'],
    parameters.item,
    parameters['item-name'],
    parameters.productname,
  ];
  const product = productCandidates.find(p => p !== undefined && p !== null && p !== '');
  if (product) {
    entities.product = String(product);
  }
  
  // Quantity extraction - try all possible parameter names
  const quantityCandidates = [
    parameters.quantity,
    parameters.number,
    parameters.amount,
    parameters.count,
    parameters.qty,
  ];
  const quantity = quantityCandidates.find(q => q !== undefined && q !== null && q !== '');
  if (quantity) {
    const parsed = parseFloat(String(quantity));
    if (!isNaN(parsed)) {
      entities.quantity = parsed;
    }
  }
  
  // Unit extraction - try all possible parameter names
  const unitCandidates = [
    parameters.unit,
    parameters['unit-name'],
    parameters.unitname,
    parameters.measure,
  ];
  const unit = unitCandidates.find(u => u !== undefined && u !== null && u !== '');
  if (unit) {
    entities.unit = String(unit);
  }
  
  // Price extraction
  if (parameters.price) {
    const parsed = parseFloat(String(parameters.price));
    if (!isNaN(parsed)) {
      entities.price = parsed;
    }
  }

  // Debug log to see what we extracted
  console.log('[Dialogflow Parsed]', {
    intent: mappedIntent,
    confidence: confidence.toFixed(2),
    entities,
    parameters, // Show raw parameters for debugging
  });
  
  // Warning if confidence is low
  if (confidence < 0.5) {
    console.warn('[Dialogflow] Low confidence!', {
      queryText: queryResult.queryText,
      detectedIntent: intentName,
      confidence,
      suggestion: 'Add more training phrases to this intent in Dialogflow Console'
    });
  }
  
  // Warning if intent detected but entities missing
  if (mappedIntent === 'billing.add' || mappedIntent === 'inventory.add') {
    if (!entities.product) {
      console.warn('[Dialogflow] Product not extracted!', {
        queryText: queryResult.queryText,
        parameters,
        suggestion: 'Check @product entity in Dialogflow has synonyms'
      });
    }
    if (!entities.quantity) {
      console.warn('[Dialogflow] Quantity not extracted!', {
        queryText: queryResult.queryText,
        parameters,
        suggestion: 'Check parameter uses @sys.number entity'
      });
    }
  }

  return {
    intent: mappedIntent,
    confidence,
    entities,
    fulfillmentText: queryResult.fulfillmentText || '',
    rawQuery,
  };
}
